const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const MAX_INPUT_BYTES = 25 * 1024 * 1024
export const DETAIL_MAX_EDGE = 1800
export const THUMBNAIL_MAX_EDGE = 480

export type ImageValidationResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported-type' | 'too-large' | 'empty-file' }

export interface ProcessedImage {
  detail: { id: string; blob: Blob; mimeType: string }
  thumbnail: { id: string; blob: Blob; mimeType: string }
}

export function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function chooseFallbackMimeType(hasAlpha: boolean) {
  return hasAlpha ? 'image/png' : 'image/jpeg'
}

export function validateImageFile(file: File): ImageValidationResult {
  if (file.size === 0) return { ok: false, reason: 'empty-file' }
  if (!SUPPORTED_TYPES.has(file.type)) return { ok: false, reason: 'unsupported-type' }
  if (file.size > MAX_INPUT_BYTES) return { ok: false, reason: 'too-large' }
  return { ok: true }
}

interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  dispose: () => void
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      dispose: () => bitmap.close(),
    }
  }

  const objectUrl = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'
  image.src = objectUrl
  await image.decode()
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    dispose: () => URL.revokeObjectURL(objectUrl),
  }
}

function drawImage(decoded: DecodedImage, maxEdge: number) {
  const size = fitWithin(decoded.width, decoded.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) throw new Error('Canvas is unavailable')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(decoded.source, 0, 0, size.width, size.height)
  return { canvas, context }
}

function canvasHasTransparency(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) return true
  }
  return false
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

async function exportCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  quality: number,
) {
  const webp = await toBlob(canvas, 'image/webp', quality)
  if (webp?.type === 'image/webp') return webp

  const hasAlpha = canvasHasTransparency(canvas, context)
  const fallbackType = chooseFallbackMimeType(hasAlpha)
  const fallback = await toBlob(canvas, fallbackType, fallbackType === 'image/jpeg' ? quality : undefined)
  if (!fallback) throw new Error('The browser could not encode this image')
  return fallback
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const validation = validateImageFile(file)
  if (!validation.ok) throw new Error(`Image rejected: ${validation.reason}`)

  const decoded = await decodeImage(file)
  try {
    const detailCanvas = drawImage(decoded, DETAIL_MAX_EDGE)
    const thumbnailCanvas = drawImage(decoded, THUMBNAIL_MAX_EDGE)
    const [detailBlob, thumbnailBlob] = await Promise.all([
      exportCanvas(detailCanvas.canvas, detailCanvas.context, 0.82),
      exportCanvas(thumbnailCanvas.canvas, thumbnailCanvas.context, 0.76),
    ])

    return {
      detail: { id: crypto.randomUUID(), blob: detailBlob, mimeType: detailBlob.type },
      thumbnail: { id: crypto.randomUUID(), blob: thumbnailBlob, mimeType: thumbnailBlob.type },
    }
  } finally {
    decoded.dispose()
  }
}
