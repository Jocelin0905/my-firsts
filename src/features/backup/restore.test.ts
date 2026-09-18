import { describe, expect, it, vi } from 'vitest'
import { createEmptyAppData } from '../../domain/validation'
import { APP_DATA_KEY } from '../../storage/storageKeys'
import type { StorageLike } from '../../storage/appDataRepository'
import { restoreBackup } from './restore'

class MemoryStorage implements StorageLike {
  value = JSON.stringify(createEmptyAppData())
  failWrites = false
  getItem(key: string) { return key === APP_DATA_KEY ? this.value : null }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('quota')
    if (key === APP_DATA_KEY) this.value = value
  }
  removeItem() { this.value = '' }
}

const backup = JSON.stringify({
  format: 'my-firsts-backup',
  version: 1,
  exportedAt: '2026-09-17T00:00:00.000Z',
  appData: {
    version: 1,
    firsts: [{
      id: 'first-1', number: 4, year: 2026, title: '第一次潜水', date: '2026-08-14', category: 'Travel',
      imageId: 'detail-1', thumbnailId: 'thumb-1', createdAt: '2026-08-14T00:00:00.000Z', updatedAt: '2026-08-14T00:00:00.000Z',
    }],
    numberCounters: { '2026': 4 },
    celebratedMilestones: { '2026': [10] },
  },
  images: [
    { id: 'detail-1', kind: 'detail', mimeType: 'image/webp', base64: 'ZGV0YWls' },
    { id: 'thumb-1', kind: 'thumbnail', mimeType: 'image/webp', base64: 'dGh1bWI=' },
  ],
})

function harness() {
  const storage = new MemoryStorage()
  const images = {
    putMany: vi.fn(async () => undefined),
    deleteMany: vi.fn(async () => undefined),
  }
  return { storage, images }
}

describe('atomic backup restore', () => {
  it('does not write anything when validation fails', async () => {
    const { storage, images } = harness()
    const original = storage.value

    await expect(restoreBackup('{broken', { storage, images, batchId: () => 'batch' })).rejects.toThrow('valid')
    expect(storage.value).toBe(original)
    expect(images.putMany).not.toHaveBeenCalled()
  })

  it('stages remapped images before switching AppData', async () => {
    const { storage, images } = harness()

    const result = await restoreBackup(backup, { storage, images, batchId: () => 'batch' })

    expect(images.putMany).toHaveBeenCalledOnce()
    expect(result.data.firsts[0]).toMatchObject({ imageId: 'batch:detail-1', thumbnailId: 'batch:thumb-1', number: 4 })
    expect(JSON.parse(storage.value)).toEqual(result.data)
  })

  it('removes staged images and preserves old text when the switch fails', async () => {
    const { storage, images } = harness()
    const original = storage.value
    storage.failWrites = true

    await expect(restoreBackup(backup, { storage, images, batchId: () => 'batch' })).rejects.toThrow('switch')
    expect(storage.value).toBe(original)
    expect(images.deleteMany).toHaveBeenCalledWith(['batch:detail-1', 'batch:thumb-1'])
  })
})
