import type { AppData } from '../domain/types'
import { createEmptyAppData, validateAppData } from '../domain/validation'
import { migrateAppData } from './migrations'
import { APP_DATA_KEY } from './storageKeys'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type LoadResult =
  | { status: 'ready'; data: AppData }
  | { status: 'recovery'; reason: 'invalid-json' | 'invalid-structure' | 'storage-unavailable'; raw: string | null; issues: string[] }

export function loadAppData(storage?: StorageLike): LoadResult {
  let raw: string | null
  try {
    raw = (storage ?? window.localStorage).getItem(APP_DATA_KEY)
  } catch (error) {
    return { status: 'recovery', reason: 'storage-unavailable', raw: null, issues: [String(error)] }
  }

  if (raw === null) return { status: 'ready', data: createEmptyAppData() }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { status: 'recovery', reason: 'invalid-json', raw, issues: ['Stored data is not valid JSON'] }
  }

  const result = migrateAppData(parsed)
  if (!result.ok) {
    return { status: 'recovery', reason: 'invalid-structure', raw, issues: result.issues }
  }

  return { status: 'ready', data: result.value }
}

export type SaveResult = { ok: true } | { ok: false; reason: 'invalid-data' | 'write-failed'; issues: string[] }

export function saveAppData(storage: StorageLike | undefined, data: AppData): SaveResult {
  const result = validateAppData(data)
  if (!result.ok) return { ok: false, reason: 'invalid-data', issues: result.issues }

  try {
    ;(storage ?? window.localStorage).setItem(APP_DATA_KEY, JSON.stringify(result.value))
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: 'write-failed', issues: [String(error)] }
  }
}
