import { describe, expect, it } from 'vitest'
import { createEmptyAppData } from '../../domain/validation'
import type { StoredImage } from '../../storage/imageRepository'
import { createBackup, parseBackup } from './backup'

const first = {
  id: 'first-1',
  number: 1,
  year: 2026,
  title: '第一次潜水',
  date: '2026-08-14',
  category: 'Travel' as const,
  imageId: 'detail-1',
  thumbnailId: 'thumb-1',
  createdAt: '2026-08-14T00:00:00.000Z',
  updatedAt: '2026-08-14T00:00:00.000Z',
}

const image = (id: string, kind: StoredImage['kind']): StoredImage => ({
  id,
  kind,
  mimeType: 'image/webp',
  blob: new Blob([id], { type: 'image/webp' }),
  createdAt: '2026-08-14T00:00:00.000Z',
})

describe('complete backup contract', () => {
  it('round-trips app data, counters, milestones, and both image sizes', async () => {
    const data = {
      ...createEmptyAppData(),
      firsts: [first],
      numberCounters: { '2026': 1 },
      celebratedMilestones: { '2026': [10] },
    }

    const backup = await createBackup(data, [image('detail-1', 'detail'), image('thumb-1', 'thumbnail')], '2026-09-17T00:00:00.000Z')
    const parsed = parseBackup(JSON.stringify(backup))

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.value.appData).toEqual(data)
      expect(parsed.value.images.map((item) => item.id)).toEqual(['detail-1', 'thumb-1'])
    }
  })

  it('refuses to export when a referenced image is missing', async () => {
    const data = {
      ...createEmptyAppData(),
      firsts: [first],
      numberCounters: { '2026': 1 },
    }

    await expect(createBackup(data, [image('detail-1', 'detail')], '2026-09-17T00:00:00.000Z')).rejects.toThrow('missing')
  })

  it('rejects a backup that shares one image pair across multiple Firsts', async () => {
    const data = {
      ...createEmptyAppData(),
      firsts: [first, { ...first, id: 'first-2', number: 2 }],
      numberCounters: { '2026': 2 },
    }
    const backup = {
      format: 'my-firsts-backup',
      version: 1,
      exportedAt: '2026-09-17T00:00:00.000Z',
      appData: data,
      images: [
        { id: 'detail-1', kind: 'detail', mimeType: 'image/webp', base64: 'YQ==' },
        { id: 'thumb-1', kind: 'thumbnail', mimeType: 'image/webp', base64: 'YQ==' },
      ],
    }

    expect(parseBackup(JSON.stringify(backup)).ok).toBe(false)
  })

  it.each([
    ['invalid JSON', '{broken'],
    ['unknown version', JSON.stringify({ format: 'my-firsts-backup', version: 2 })],
    ['missing image payload', JSON.stringify({
      format: 'my-firsts-backup',
      version: 1,
      exportedAt: '2026-09-17T00:00:00.000Z',
      appData: { ...createEmptyAppData(), firsts: [first], numberCounters: { '2026': 1 } },
      images: [],
    })],
    ['mismatched image kinds', JSON.stringify({
      format: 'my-firsts-backup',
      version: 1,
      exportedAt: '2026-09-17T00:00:00.000Z',
      appData: { ...createEmptyAppData(), firsts: [first], numberCounters: { '2026': 1 } },
      images: [
        { id: 'detail-1', kind: 'thumbnail', mimeType: 'image/webp', base64: 'YQ==' },
        { id: 'thumb-1', kind: 'detail', mimeType: 'image/webp', base64: 'YQ==' },
      ],
    })],
  ])('rejects %s before restore', (_label, raw) => {
    expect(parseBackup(raw).ok).toBe(false)
  })
})
