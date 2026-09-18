import type { First } from '../../domain/types'
import { validateSingleFirst } from '../../domain/validation'

export interface RecoveryPreview {
  validFirsts: First[]
  rejectedCount: number
}

export function previewRecoverableFirsts(raw: string): RecoveryPreview {
  try {
    const parsed = JSON.parse(raw) as { firsts?: unknown }
    if (!Array.isArray(parsed?.firsts)) return { validFirsts: [], rejectedCount: 0 }

    const validFirsts: First[] = []
    let rejectedCount = 0
    for (const candidate of parsed.firsts) {
      const result = validateSingleFirst(candidate)
      if (result.ok) validFirsts.push(result.value)
      else rejectedCount += 1
    }
    return { validFirsts, rejectedCount }
  } catch {
    return { validFirsts: [], rejectedCount: 0 }
  }
}
