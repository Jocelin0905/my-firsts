import {
  APP_DATA_VERSION,
  MILESTONE_THRESHOLDS,
  NOTE_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from './constants'
import { FIRST_CATEGORIES, type AppData, type First, type ValidationResult } from './types'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !datePattern.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value))
}

function localToday() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function validateFirst(value: unknown, index: number, issues: string[]): value is First {
  if (!isRecord(value)) {
    issues.push(`firsts[${index}] must be an object`)
    return false
  }

  const title = typeof value.title === 'string' ? value.title.trim() : ''
  const dateValue = typeof value.date === 'string' ? value.date : ''
  const validDate = isValidCalendarDate(dateValue)
  const dateYear = validDate ? Number(dateValue.slice(0, 4)) : null

  if (typeof value.id !== 'string' || value.id.length === 0) issues.push(`firsts[${index}].id is invalid`)
  if (!Number.isInteger(value.number) || Number(value.number) < 1) issues.push(`firsts[${index}].number is invalid`)
  if (!Number.isInteger(value.year) || Number(value.year) < 1) issues.push(`firsts[${index}].year is invalid`)
  if (!title || title.length > TITLE_MAX_LENGTH || title !== value.title) issues.push(`firsts[${index}].title is invalid`)
  if (!validDate) issues.push(`firsts[${index}].date is invalid`)
  if (validDate && dateValue > localToday()) issues.push(`firsts[${index}].date cannot be in the future`)
  if (validDate && value.year !== dateYear) issues.push(`firsts[${index}].year must match date`)
  if (!FIRST_CATEGORIES.includes(value.category as never)) issues.push(`firsts[${index}].category is invalid`)
  if (value.note !== undefined && (typeof value.note !== 'string' || value.note.length > NOTE_MAX_LENGTH)) {
    issues.push(`firsts[${index}].note is invalid`)
  }
  if (value.imageId !== undefined && (typeof value.imageId !== 'string' || value.imageId.length === 0)) {
    issues.push(`firsts[${index}].imageId is invalid`)
  }
  if (value.thumbnailId !== undefined && (typeof value.thumbnailId !== 'string' || value.thumbnailId.length === 0)) {
    issues.push(`firsts[${index}].thumbnailId is invalid`)
  }
  if (Boolean(value.imageId) !== Boolean(value.thumbnailId)) {
    issues.push(`firsts[${index}] must reference both detail and thumbnail images`)
  }
  if (!isIsoTimestamp(value.createdAt)) issues.push(`firsts[${index}].createdAt is invalid`)
  if (!isIsoTimestamp(value.updatedAt)) issues.push(`firsts[${index}].updatedAt is invalid`)

  return issues.length === 0
}

function validateYearMap(
  value: unknown,
  label: string,
  validateValue: (entry: unknown) => boolean,
  issues: string[],
) {
  if (!isRecord(value)) {
    issues.push(`${label} must be an object`)
    return
  }

  for (const [year, entry] of Object.entries(value)) {
    if (!/^\d{4}$/.test(year) || Number(year) < 1) issues.push(`${label}.${year} has an invalid year`)
    if (!validateValue(entry)) issues.push(`${label}.${year} is invalid`)
  }
}

export function createEmptyAppData(): AppData {
  return {
    version: APP_DATA_VERSION,
    firsts: [],
    numberCounters: {},
    celebratedMilestones: {},
  }
}

export function validateAppData(value: unknown): ValidationResult<AppData> {
  const issues: string[] = []

  if (!isRecord(value)) return { ok: false, issues: ['AppData must be an object'] }
  if (value.version !== APP_DATA_VERSION) issues.push('Unsupported data version')
  if (!Array.isArray(value.firsts)) issues.push('firsts must be an array')

  validateYearMap(
    value.numberCounters,
    'numberCounters',
    (entry) => Number.isInteger(entry) && Number(entry) >= 0,
    issues,
  )
  validateYearMap(
    value.celebratedMilestones,
    'celebratedMilestones',
    (entry) =>
      Array.isArray(entry) &&
      new Set(entry).size === entry.length &&
      entry.every((milestone) => MILESTONE_THRESHOLDS.includes(milestone as never)),
    issues,
  )

  const firsts = Array.isArray(value.firsts) ? value.firsts : []
  for (const [index, first] of firsts.entries()) {
    const firstIssues: string[] = []
    validateFirst(first, index, firstIssues)
    issues.push(...firstIssues)
  }

  const ids = firsts.flatMap((first) => (isRecord(first) && typeof first.id === 'string' ? [first.id] : []))
  if (new Set(ids).size !== ids.length) issues.push('First ids must be unique')

  const numbered = new Set<string>()
  for (const first of firsts) {
    if (!isRecord(first) || !Number.isInteger(first.year) || !Number.isInteger(first.number)) continue
    const key = `${first.year}:${first.number}`
    if (numbered.has(key)) issues.push(`FIRST number ${key} is duplicated`)
    numbered.add(key)

    const counter = isRecord(value.numberCounters) ? value.numberCounters[String(first.year)] : undefined
    if (!Number.isInteger(counter) || Number(counter) < Number(first.number)) {
      issues.push(`numberCounters.${first.year} is lower than an allocated number`)
    }
  }

  if (issues.length > 0) return { ok: false, issues }
  return { ok: true, value: value as unknown as AppData }
}

export function validateSingleFirst(value: unknown): ValidationResult<First> {
  const issues: string[] = []
  validateFirst(value, 0, issues)
  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: value as First }
}
