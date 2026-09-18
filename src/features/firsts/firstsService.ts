import { addFirst, deleteFirst, editFirst, type FirstDraft } from '../../domain/firsts'
import { registerMilestoneAfterCreate } from '../../domain/milestones'
import type { AppData } from '../../domain/types'
import { loadAppData, saveAppData, type StorageLike } from '../../storage/appDataRepository'
import { deleteImages, putImagePair, type StoredImage } from '../../storage/imageRepository'
import { processImage, type ProcessedImage } from '../images/imageProcessor'

interface ImageGateway {
  putPair(detail: StoredImage, thumbnail: StoredImage): Promise<void>
  deleteMany(ids: string[]): Promise<void>
}

interface FirstsServiceDependencies {
  storage?: StorageLike
  images?: ImageGateway
  processImage?: (file: File) => Promise<ProcessedImage>
  createId?: () => string
  now?: () => string
}

const browserImages: ImageGateway = {
  putPair: putImagePair,
  deleteMany: deleteImages,
}

export class FirstsService {
  private readonly storage?: StorageLike
  private readonly images: ImageGateway
  private readonly imageProcessor: (file: File) => Promise<ProcessedImage>
  private readonly createId: () => string
  private readonly now: () => string

  constructor(dependencies: FirstsServiceDependencies = {}) {
    this.storage = dependencies.storage
    this.images = dependencies.images ?? browserImages
    this.imageProcessor = dependencies.processImage ?? processImage
    this.createId = dependencies.createId ?? (() => crypto.randomUUID())
    this.now = dependencies.now ?? (() => new Date().toISOString())
  }

  read(): AppData {
    const result = loadAppData(this.storage)
    if (result.status === 'recovery') throw new Error('Stored data requires recovery')
    return result.data
  }

  private persist(data: AppData) {
    const result = saveAppData(this.storage, data)
    if (!result.ok) throw new Error(`Could not save Firsts: ${result.issues.join(', ')}`)
  }

  private toStoredImages(processed: ProcessedImage, timestamp: string) {
    const detail: StoredImage = {
      ...processed.detail,
      kind: 'detail',
      createdAt: timestamp,
    }
    const thumbnail: StoredImage = {
      ...processed.thumbnail,
      kind: 'thumbnail',
      createdAt: timestamp,
    }
    return { detail, thumbnail }
  }

  async create(draft: FirstDraft, imageFile?: File) {
    const data = this.read()
    const timestamp = this.now()
    let imageIds: string[] = []
    let finalDraft = draft

    if (imageFile) {
      const processed = await this.imageProcessor(imageFile)
      const stored = this.toStoredImages(processed, timestamp)
      await this.images.putPair(stored.detail, stored.thumbnail)
      imageIds = [stored.detail.id, stored.thumbnail.id]
      finalDraft = { ...draft, imageId: stored.detail.id, thumbnailId: stored.thumbnail.id }
    }

    const previousCount = data.firsts.filter((first) => first.year === Number(draft.date.slice(0, 4))).length
    const created = addFirst(data, finalDraft, this.createId(), timestamp)
    const milestone = registerMilestoneAfterCreate(created.data, created.first.year, previousCount)

    try {
      this.persist(milestone.data)
    } catch (error) {
      if (imageIds.length > 0) await this.images.deleteMany(imageIds).catch(() => undefined)
      throw error
    }

    return { first: created.first, data: milestone.data, milestone: milestone.milestone }
  }

  async edit(id: string, draft: FirstDraft, imageFile?: File, removeImage = false) {
    const data = this.read()
    const existing = data.firsts.find((first) => first.id === id)
    if (!existing) throw new Error('First not found')

    const timestamp = this.now()
    let newImageIds: string[] = []
    let finalDraft: FirstDraft = removeImage ? draft : {
      ...draft,
      ...(existing.imageId ? { imageId: existing.imageId } : {}),
      ...(existing.thumbnailId ? { thumbnailId: existing.thumbnailId } : {}),
    }

    if (imageFile) {
      const processed = await this.imageProcessor(imageFile)
      const stored = this.toStoredImages(processed, timestamp)
      await this.images.putPair(stored.detail, stored.thumbnail)
      newImageIds = [stored.detail.id, stored.thumbnail.id]
      finalDraft = { ...draft, imageId: stored.detail.id, thumbnailId: stored.thumbnail.id }
    }

    const edited = editFirst(data, id, finalDraft, timestamp)
    try {
      this.persist(edited.data)
    } catch (error) {
      if (newImageIds.length > 0) await this.images.deleteMany(newImageIds).catch(() => undefined)
      throw error
    }

    let cleanupPending = false
    if (newImageIds.length > 0 || removeImage) {
      const oldIds = [existing.imageId, existing.thumbnailId].filter((value): value is string => Boolean(value))
      try {
        await this.images.deleteMany(oldIds)
      } catch {
        cleanupPending = true
      }
    }

    return { ...edited, cleanupPending }
  }

  async remove(id: string) {
    const result = deleteFirst(this.read(), id)
    this.persist(result.data)

    const imageIds = [result.deleted.imageId, result.deleted.thumbnailId].filter(
      (value): value is string => Boolean(value),
    )
    let cleanupPending = false
    try {
      await this.images.deleteMany(imageIds)
    } catch {
      cleanupPending = true
    }

    return { ...result, cleanupPending }
  }
}
