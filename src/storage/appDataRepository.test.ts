import { describe, expect, it } from 'vitest'
import { createEmptyAppData, validateAppData } from '../domain/validation'
import { loadAppData, saveAppData, type StorageLike } from './appDataRepository'
import { APP_DATA_KEY } from './storageKeys'

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

const validFirst = {
  id: 'first-1',
  number: 1,
  year: 2026,
  title: '第一次潜水',
  date: '2026-08-14',
  category: 'Travel',
  note: '比想象中更安静。',
  createdAt: '2026-08-14T10:00:00.000Z',
  updatedAt: '2026-08-14T10:00:00.000Z',
} as const

describe('AppData validation', () => {
  it('accepts a complete V1 data set', () => {
    const result = validateAppData({
      version: 1,
      firsts: [validFirst],
      numberCounters: { '2026': 1 },
      celebratedMilestones: { '2026': [] },
    })

    expect(result.ok).toBe(true)
  })

  it.each([
    ['an unsupported version', { version: 2, firsts: [], numberCounters: {}, celebratedMilestones: {} }],
    ['a missing field', { version: 1, firsts: [], numberCounters: {} }],
    ['a duplicate id', { version: 1, firsts: [validFirst, validFirst], numberCounters: { '2026': 1 }, celebratedMilestones: {} }],
    ['an invalid category', { version: 1, firsts: [{ ...validFirst, category: 'Work' }], numberCounters: { '2026': 1 }, celebratedMilestones: {} }],
    ['a mismatched year', { version: 1, firsts: [{ ...validFirst, year: 2025 }], numberCounters: { '2026': 1 }, celebratedMilestones: {} }],
    ['a future event date', { version: 1, firsts: [{ ...validFirst, year: 2999, date: '2999-01-01' }], numberCounters: { '2999': 1 }, celebratedMilestones: {} }],
    ['an unpaired image reference', { version: 1, firsts: [{ ...validFirst, imageId: 'detail-1' }], numberCounters: { '2026': 1 }, celebratedMilestones: {} }],
    ['a reused counter', { version: 1, firsts: [{ ...validFirst, number: 3 }], numberCounters: { '2026': 2 }, celebratedMilestones: {} }],
  ])('rejects %s', (_label, input) => {
    expect(validateAppData(input).ok).toBe(false)
  })
})

describe('AppData repository', () => {
  it('returns empty data when storage has not been initialized', () => {
    const result = loadAppData(new MemoryStorage())

    expect(result).toEqual({ status: 'ready', data: createEmptyAppData() })
  })

  it('round-trips valid data', () => {
    const storage = new MemoryStorage()
    const data = {
      version: 1 as const,
      firsts: [validFirst],
      numberCounters: { '2026': 1 },
      celebratedMilestones: { '2026': [] },
    }

    expect(saveAppData(storage, data)).toEqual({ ok: true })
    expect(loadAppData(storage)).toEqual({ status: 'ready', data })
  })

  it('preserves corrupt JSON for recovery without overwriting it', () => {
    const storage = new MemoryStorage()
    storage.setItem(APP_DATA_KEY, '{broken-json')

    const result = loadAppData(storage)

    expect(result.status).toBe('recovery')
    expect(result).toMatchObject({ raw: '{broken-json', reason: 'invalid-json' })
    expect(storage.getItem(APP_DATA_KEY)).toBe('{broken-json')
  })

  it('preserves an unknown data version for recovery', () => {
    const storage = new MemoryStorage()
    const raw = JSON.stringify({ version: 99, firsts: [], numberCounters: {}, celebratedMilestones: {} })
    storage.setItem(APP_DATA_KEY, raw)

    expect(loadAppData(storage)).toMatchObject({ status: 'recovery', reason: 'invalid-structure', raw })
    expect(storage.getItem(APP_DATA_KEY)).toBe(raw)
  })

  it('returns a recovery state when browser storage is unavailable', () => {
    const unavailable: StorageLike = {
      getItem: () => { throw new DOMException('Storage blocked', 'SecurityError') },
      setItem: () => { throw new DOMException('Storage blocked', 'SecurityError') },
      removeItem: () => { throw new DOMException('Storage blocked', 'SecurityError') },
    }

    expect(loadAppData(unavailable)).toMatchObject({ status: 'recovery', reason: 'storage-unavailable', raw: null })
  })

  it('does not overwrite storage with invalid data', () => {
    const storage = new MemoryStorage()
    storage.setItem(APP_DATA_KEY, 'original')

    const result = saveAppData(storage, { ...createEmptyAppData(), version: 2 } as never)

    expect(result.ok).toBe(false)
    expect(storage.getItem(APP_DATA_KEY)).toBe('original')
  })
})
