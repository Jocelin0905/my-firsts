import type { AppData } from '../../domain/types'
import type { StoredImage } from '../../storage/imageRepository'
import { validateBackup, type BackupV1 } from './backupSchema'

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image'))
    reader.onload = () => {
      const result = String(reader.result)
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(blob)
  })
}

export async function createBackup(data: AppData, images: StoredImage[], exportedAt = new Date().toISOString()): Promise<BackupV1> {
  const byId = new Map(images.map((image) => [image.id, image]))
  const referenced = new Set<string>()
  for (const first of data.firsts) {
    if (first.imageId) referenced.add(first.imageId)
    if (first.thumbnailId) referenced.add(first.thumbnailId)
  }

  const missing = [...referenced].filter((id) => !byId.has(id))
  if (missing.length > 0) throw new Error(`Complete backup failed: missing images ${missing.join(', ')}`)

  const backup: BackupV1 = {
    format: 'my-firsts-backup',
    version: 1,
    exportedAt,
    appData: data,
    images: await Promise.all([...referenced].map(async (id) => {
      const image = byId.get(id)!
      return {
        id: image.id,
        kind: image.kind,
        mimeType: image.mimeType,
        base64: await blobToBase64(image.blob),
      }
    })),
  }

  const validation = validateBackup(backup)
  if (!validation.ok) throw new Error(`Complete backup failed: ${validation.issues.join(', ')}`)
  return validation.value
}

export function parseBackup(raw: string) {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return { ok: false as const, issues: ['Backup is not valid JSON'] }
  }
  return validateBackup(value)
}

export function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: mimeType })
}
