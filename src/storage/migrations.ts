import type { AppData, ValidationResult } from '../domain/types'
import { validateAppData } from '../domain/validation'

export function migrateAppData(value: unknown): ValidationResult<AppData> {
  return validateAppData(value)
}
