import { describe, expect, it } from 'vitest'
import { createEmptyAppData } from './validation'
import {
  addFirst,
  deleteFirst,
  editFirst,
  getAvailableYears,
  getYearStats,
  selectFirsts,
} from './firsts'
import { registerMilestoneAfterCreate } from './milestones'

const input = {
  title: '第一次潜水',
  date: '2026-08-14',
  category: 'Travel' as const,
  note: '很安静。',
}

describe('FIRST numbering', () => {
  it('allocates independent monotonic numbers per year', () => {
    let data = createEmptyAppData()
    const first = addFirst(data, input, 'id-1', '2026-09-01T00:00:00.000Z')
    data = first.data
    const second = addFirst(data, { ...input, date: '2026-01-02' }, 'id-2', '2026-09-02T00:00:00.000Z')
    data = second.data
    const historical = addFirst(data, { ...input, date: '2025-12-31' }, 'id-3', '2026-09-03T00:00:00.000Z')

    expect(first.first.number).toBe(1)
    expect(second.first.number).toBe(2)
    expect(historical.first.number).toBe(1)
    expect(historical.data.numberCounters).toEqual({ '2025': 1, '2026': 2 })
  })

  it('never reuses the highest deleted number', () => {
    let data = addFirst(createEmptyAppData(), input, 'id-1', '2026-09-01T00:00:00.000Z').data
    data = addFirst(data, input, 'id-2', '2026-09-02T00:00:00.000Z').data
    data = deleteFirst(data, 'id-2').data

    const next = addFirst(data, input, 'id-3', '2026-09-03T00:00:00.000Z')

    expect(next.first.number).toBe(3)
    expect(next.data.numberCounters['2026']).toBe(3)
  })

  it('assigns a new target-year number when an edit crosses years', () => {
    let data = addFirst(createEmptyAppData(), { ...input, date: '2025-01-01' }, 'old', '2025-01-02T00:00:00.000Z').data
    data = addFirst(data, input, 'moving', '2026-02-01T00:00:00.000Z').data

    const result = editFirst(data, 'moving', { ...input, date: '2025-12-20' }, '2026-09-05T00:00:00.000Z')

    expect(result.first).toMatchObject({ id: 'moving', year: 2025, number: 2, createdAt: '2026-02-01T00:00:00.000Z' })
    expect(result.data.numberCounters).toEqual({ '2025': 2, '2026': 1 })
  })
})

describe('year selection and ordering', () => {
  it('includes years retained only by counters or milestones', () => {
    const data = {
      ...createEmptyAppData(),
      numberCounters: { '2024': 8 },
      celebratedMilestones: { '2025': [10] },
    }

    expect(getAvailableYears(data, 2026)).toEqual([2024, 2025, 2026])
  })

  it('sorts by event date then creation time, never by FIRST number', () => {
    let data = addFirst(createEmptyAppData(), { ...input, date: '2026-01-01' }, 'id-1', '2026-05-01T00:00:00.000Z').data
    data = addFirst(data, { ...input, date: '2026-08-01' }, 'id-2', '2026-05-02T00:00:00.000Z').data
    data = addFirst(data, { ...input, date: '2026-08-01' }, 'id-3', '2026-05-03T00:00:00.000Z').data

    expect(selectFirsts(data, 2026, 'All').map((first) => first.id)).toEqual(['id-3', 'id-2', 'id-1'])
  })

  it('filters a year by category and derives review stats', () => {
    let data = addFirst(createEmptyAppData(), input, 'id-1', '2026-08-14T00:00:00.000Z').data
    data = addFirst(data, { ...input, category: 'Food', date: '2026-01-02' }, 'id-2', '2026-01-02T00:00:00.000Z').data

    expect(selectFirsts(data, 2026, 'Travel')).toHaveLength(1)
    expect(getYearStats(data, 2026)).toMatchObject({
      total: 2,
      categories: { Travel: 1, Food: 1 },
    })
    expect(getYearStats(data, 2026).months).toEqual([1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0])
  })
})

describe('milestones', () => {
  it('registers a crossed threshold once for the record year', () => {
    const data = { ...createEmptyAppData(), firsts: Array.from({ length: 10 }, (_, index) => ({
      id: `id-${index}`,
      number: index + 1,
      year: 2026,
      title: `First ${index + 1}`,
      date: '2026-01-01',
      category: 'Other' as const,
      createdAt: `2026-01-01T00:00:${String(index).padStart(2, '0')}.000Z`,
      updatedAt: `2026-01-01T00:00:${String(index).padStart(2, '0')}.000Z`,
    })), numberCounters: { '2026': 10 } }

    const first = registerMilestoneAfterCreate(data, 2026, 9)
    const repeated = registerMilestoneAfterCreate(first.data, 2026, 9)

    expect(first.milestone).toBe(10)
    expect(first.data.celebratedMilestones['2026']).toEqual([10])
    expect(repeated.milestone).toBeNull()
  })
})
