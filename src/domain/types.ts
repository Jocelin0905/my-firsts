export const FIRST_CATEGORIES = [
  'Travel',
  'Food',
  'Create',
  'Courage',
  'People',
  'Learn',
  'Life',
  'Other',
] as const

export type FirstCategory = (typeof FIRST_CATEGORIES)[number]

export interface First {
  id: string
  number: number
  year: number
  title: string
  date: string
  category: FirstCategory
  note?: string
  imageId?: string
  thumbnailId?: string
  createdAt: string
  updatedAt: string
}

export interface AppData {
  version: 1
  firsts: First[]
  numberCounters: Record<string, number>
  celebratedMilestones: Record<string, number[]>
}

export interface ValidationSuccess<T> {
  ok: true
  value: T
}

export interface ValidationFailure {
  ok: false
  issues: string[]
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure
