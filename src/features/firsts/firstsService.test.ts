import { describe, expect, it, vi } from 'vitest'
import type { ProcessedImage } from '../images/imageProcessor'
import { FirstsService } from './firstsService'
import type { StorageLike } from '../../storage/appDataRepository'

class MemoryStorage implements StorageLike {
  values = new Map<string, string>()
  failWrites = false
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('quota')
    this.values.set(key, value)
  }
  removeItem(key: string) { this.values.delete(key) }
}

const draft = {
  title: '第一次潜水',
  date: '2026-08-14',
  category: 'Travel' as const,
  note: '很安静。',
}

const processed: ProcessedImage = {
  detail: { id: 'detail-1', blob: new Blob(['detail'], { type: 'image/webp' }), mimeType: 'image/webp' },
  thumbnail: { id: 'thumb-1', blob: new Blob(['thumb'], { type: 'image/webp' }), mimeType: 'image/webp' },
}

function createHarness() {
  const storage = new MemoryStorage()
  const images = {
    putPair: vi.fn(async () => undefined),
    deleteMany: vi.fn(async () => undefined),
  }
  const service = new FirstsService({
    storage,
    images,
    processImage: vi.fn(async () => processed),
    createId: () => 'first-1',
    now: () => '2026-09-17T00:00:00.000Z',
  })
  return { storage, images, service }
}

describe('FirstsService consistency', () => {
  it('stores images before committing a new text record', async () => {
    const { service, images } = createHarness()
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })

    const result = await service.create(draft, file)

    expect(images.putPair).toHaveBeenCalledOnce()
    expect(result.first).toMatchObject({ id: 'first-1', imageId: 'detail-1', thumbnailId: 'thumb-1', number: 1 })
    expect(service.read().firsts).toHaveLength(1)
  })

  it('rolls back newly stored images when text persistence fails', async () => {
    const { service, images, storage } = createHarness()
    storage.failWrites = true

    await expect(service.create(draft, new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }))).rejects.toThrow('Could not save')
    expect(images.deleteMany).toHaveBeenCalledWith(['detail-1', 'thumb-1'])
  })

  it('keeps identity but allocates a target-year number on cross-year edit', async () => {
    const { service } = createHarness()
    await service.create(draft)

    const result = await service.edit('first-1', { ...draft, date: '2025-12-20' })

    expect(result.first).toMatchObject({ id: 'first-1', year: 2025, number: 1, createdAt: '2026-09-17T00:00:00.000Z' })
    expect(result.data.numberCounters).toEqual({ '2025': 1, '2026': 1 })
  })

  it('removes text even if orphan image cleanup must be retried', async () => {
    const { service, images } = createHarness()
    await service.create(draft, new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }))
    images.deleteMany.mockRejectedValueOnce(new Error('idb unavailable'))

    const result = await service.remove('first-1')

    expect(result.cleanupPending).toBe(true)
    expect(service.read().firsts).toHaveLength(0)
    expect(service.read().numberCounters['2026']).toBe(1)
  })

  it('removes an existing image without changing the First identity', async () => {
    const { service, images } = createHarness()
    await service.create(draft, new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }))

    const result = await service.edit('first-1', draft, undefined, true)

    expect(result.first).not.toHaveProperty('imageId')
    expect(result.first).not.toHaveProperty('thumbnailId')
    expect(result.first.id).toBe('first-1')
    expect(images.deleteMany).toHaveBeenCalledWith(['detail-1', 'thumb-1'])
  })
})
