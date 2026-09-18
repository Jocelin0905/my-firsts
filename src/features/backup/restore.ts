import type { AppData } from '../../domain/types'
import { loadAppData, saveAppData, type StorageLike } from '../../storage/appDataRepository'
import { deleteImages, putImages, type StoredImage } from '../../storage/imageRepository'
import { base64ToBlob, parseBackup } from './backup'

interface RestoreImageGateway {
  putMany(images: StoredImage[]): Promise<void>
  deleteMany(ids: string[]): Promise<void>
}

interface RestoreDependencies {
  storage?: StorageLike
  images?: RestoreImageGateway
  batchId?: () => string
}

const browserImages: RestoreImageGateway = {
  putMany: putImages,
  deleteMany: deleteImages,
}

function referencedImageIds(data: AppData) {
  return data.firsts.flatMap((first) => [first.imageId, first.thumbnailId]).filter((id): id is string => Boolean(id))
}

export async function restoreBackup(raw: string, dependencies: RestoreDependencies = {}) {
  const storage = dependencies.storage
  const images = dependencies.images ?? browserImages
  const parsed = parseBackup(raw)
  if (!parsed.ok) throw new Error(`Backup is not valid: ${parsed.issues.join(', ')}`)

  const current = loadAppData(storage)
  if (current.status === 'recovery') throw new Error('Current data must be recovered before importing a backup')

  const batch = dependencies.batchId?.() ?? crypto.randomUUID()
  const remap = new Map(parsed.value.images.map((image) => [image.id, `${batch}:${image.id}`]))
  const stagedImages: StoredImage[] = parsed.value.images.map((image) => ({
    id: remap.get(image.id)!,
    kind: image.kind,
    mimeType: image.mimeType,
    blob: base64ToBlob(image.base64, image.mimeType),
    createdAt: parsed.value.exportedAt,
  }))

  const data: AppData = {
    ...parsed.value.appData,
    firsts: parsed.value.appData.firsts.map((first) => ({
      ...first,
      ...(first.imageId ? { imageId: remap.get(first.imageId) } : {}),
      ...(first.thumbnailId ? { thumbnailId: remap.get(first.thumbnailId) } : {}),
    })),
  }
  const stagedIds = stagedImages.map((image) => image.id)

  await images.putMany(stagedImages)
  const saved = saveAppData(storage, data)
  if (!saved.ok) {
    await images.deleteMany(stagedIds).catch(() => undefined)
    throw new Error(`Could not switch to restored data: ${saved.issues.join(', ')}`)
  }

  let cleanupPending = false
  try {
    await images.deleteMany(referencedImageIds(current.data))
  } catch {
    cleanupPending = true
  }

  return { data, cleanupPending }
}
