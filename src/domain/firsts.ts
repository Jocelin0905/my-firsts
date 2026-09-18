import type { AppData, First, FirstCategory } from './types'

export interface FirstDraft {
  title: string
  date: string
  category: FirstCategory
  note?: string
  imageId?: string
  thumbnailId?: string
}

function yearFromDate(date: string) {
  return Number(date.slice(0, 4))
}

function allocateNumber(data: AppData, year: number) {
  const number = (data.numberCounters[String(year)] ?? 0) + 1
  return {
    number,
    numberCounters: { ...data.numberCounters, [String(year)]: number },
  }
}

export function addFirst(data: AppData, draft: FirstDraft, id: string, timestamp: string) {
  const year = yearFromDate(draft.date)
  const allocation = allocateNumber(data, year)
  const first: First = {
    id,
    number: allocation.number,
    year,
    title: draft.title.trim(),
    date: draft.date,
    category: draft.category,
    ...(draft.note ? { note: draft.note } : {}),
    ...(draft.imageId ? { imageId: draft.imageId } : {}),
    ...(draft.thumbnailId ? { thumbnailId: draft.thumbnailId } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return {
    first,
    data: {
      ...data,
      firsts: [...data.firsts, first],
      numberCounters: allocation.numberCounters,
    },
  }
}

export function editFirst(data: AppData, id: string, draft: FirstDraft, timestamp: string) {
  const existing = data.firsts.find((first) => first.id === id)
  if (!existing) throw new Error('First not found')

  const targetYear = yearFromDate(draft.date)
  const moved = targetYear !== existing.year
  const allocation = moved
    ? allocateNumber(data, targetYear)
    : { number: existing.number, numberCounters: data.numberCounters }

  const first: First = {
    id: existing.id,
    number: allocation.number,
    year: targetYear,
    title: draft.title.trim(),
    date: draft.date,
    category: draft.category,
    ...(draft.note ? { note: draft.note } : {}),
    ...(draft.imageId ? { imageId: draft.imageId } : {}),
    ...(draft.thumbnailId ? { thumbnailId: draft.thumbnailId } : {}),
    createdAt: existing.createdAt,
    updatedAt: timestamp,
  }

  return {
    first,
    previous: existing,
    data: {
      ...data,
      firsts: data.firsts.map((candidate) => (candidate.id === id ? first : candidate)),
      numberCounters: allocation.numberCounters,
    },
  }
}

export function deleteFirst(data: AppData, id: string) {
  const deleted = data.firsts.find((first) => first.id === id)
  if (!deleted) throw new Error('First not found')
  return {
    deleted,
    data: { ...data, firsts: data.firsts.filter((first) => first.id !== id) },
  }
}

export type FirstFilter = 'All' | FirstCategory

export function selectFirsts(data: AppData, year: number, filter: FirstFilter = 'All') {
  return data.firsts
    .filter((first) => first.year === year && (filter === 'All' || first.category === filter))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export function getAvailableYears(data: AppData, currentYear: number) {
  const years = new Set<number>([currentYear])
  data.firsts.forEach((first) => years.add(first.year))
  Object.keys(data.numberCounters).forEach((year) => years.add(Number(year)))
  Object.keys(data.celebratedMilestones).forEach((year) => years.add(Number(year)))
  return [...years].filter(Number.isInteger).sort((a, b) => a - b)
}

export function getYearStats(data: AppData, year: number) {
  const firsts = data.firsts.filter((first) => first.year === year)
  const categories: Partial<Record<FirstCategory, number>> = {}
  const months = Array.from({ length: 12 }, () => 0)

  for (const first of firsts) {
    categories[first.category] = (categories[first.category] ?? 0) + 1
    months[Number(first.date.slice(5, 7)) - 1] += 1
  }

  return {
    total: firsts.length,
    categories,
    months,
    timeline: [...firsts].sort(
      (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    ),
  }
}
