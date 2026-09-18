import type { AppData } from '../../domain/types'
import { validateAppData } from '../../domain/validation'
import type { StoredImageKind } from '../../storage/imageRepository'

export interface BackupImageV1 {
  id: string
  kind: StoredImageKind
  mimeType: string
  base64: string
}

export interface BackupV1 {
  format: 'my-firsts-backup'
  version: 1
  exportedAt: string
  appData: AppData
  images: BackupImageV1[]
}

export type BackupValidation =
  | { ok: true; value: BackupV1 }
  | { ok: false; issues: string[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBase64(value: string) {
  if (value.length === 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return false
  try {
    return btoa(atob(value).split('').join('')) === value
  } catch {
    return false
  }
}

export function validateBackup(value: unknown): BackupValidation {
  const issues: string[] = []
  if (!isRecord(value)) return { ok: false, issues: ['Backup must be an object'] }
  if (value.format !== 'my-firsts-backup') issues.push('Unknown backup format')
  if (value.version !== 1) issues.push('Unsupported backup version')
  if (typeof value.exportedAt !== 'string' || Number.isNaN(Date.parse(value.exportedAt))) issues.push('Invalid export timestamp')

  const appData = validateAppData(value.appData)
  if (!appData.ok) issues.push(...appData.issues.map((issue) => `appData: ${issue}`))

  if (!Array.isArray(value.images)) issues.push('images must be an array')
  const images: BackupImageV1[] = []
  if (Array.isArray(value.images)) {
    for (const [index, image] of value.images.entries()) {
      if (!isRecord(image)) {
        issues.push(`images[${index}] must be an object`)
        continue
      }
      if (typeof image.id !== 'string' || image.id.length === 0) issues.push(`images[${index}].id is invalid`)
      if (image.kind !== 'detail' && image.kind !== 'thumbnail') issues.push(`images[${index}].kind is invalid`)
      if (typeof image.mimeType !== 'string' || !['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType)) issues.push(`images[${index}].mimeType is invalid`)
      if (typeof image.base64 !== 'string' || !isBase64(image.base64)) issues.push(`images[${index}].base64 is invalid`)
      if (
        typeof image.id === 'string' &&
        (image.kind === 'detail' || image.kind === 'thumbnail') &&
        typeof image.mimeType === 'string' &&
        typeof image.base64 === 'string'
      ) images.push(image as unknown as BackupImageV1)
    }
  }

  const imageIds = images.map((image) => image.id)
  if (new Set(imageIds).size !== imageIds.length) issues.push('Image ids must be unique')
  if (appData.ok) {
    const imagesById = new Map(images.map((image) => [image.id, image]))
    const claimed = new Set<string>()
    for (const first of appData.value.firsts) {
      const references = [
        [first.imageId, 'detail'],
        [first.thumbnailId, 'thumbnail'],
      ] as const
      for (const [reference, expectedKind] of references) {
        if (!reference) continue
        const image = imagesById.get(reference)
        if (!image) {
          issues.push(`First ${first.id} references missing image ${reference}`)
          continue
        }
        if (image.kind !== expectedKind) {
          issues.push(`First ${first.id} references ${image.kind} image ${reference} as ${expectedKind}`)
        }
        if (claimed.has(reference)) issues.push(`Image ${reference} is referenced by more than one First`)
        claimed.add(reference)
      }
    }
  }

  if (issues.length > 0 || !appData.ok) return { ok: false, issues }
  return {
    ok: true,
    value: {
      format: 'my-firsts-backup',
      version: 1,
      exportedAt: value.exportedAt as string,
      appData: appData.value,
      images,
    },
  }
}
