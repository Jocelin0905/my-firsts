export const IMAGE_DATABASE_NAME = 'my-firsts-images'
const IMAGE_STORE_NAME = 'images'
const IMAGE_DATABASE_VERSION = 1

export type StoredImageKind = 'detail' | 'thumbnail'

export interface StoredImage {
  id: string
  kind: StoredImageKind
  mimeType: string
  blob: Blob
  createdAt: string
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'))
  })
}

export function openImageDatabase(factory: IDBFactory = window.indexedDB) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(IMAGE_DATABASE_NAME, IMAGE_DATABASE_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        request.result.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open image storage'))
    request.onblocked = () => reject(new Error('Image storage upgrade is blocked'))
  })
}

export async function putImagePair(detail: StoredImage, thumbnail: StoredImage) {
  await putImages([detail, thumbnail])
}

export async function putImages(images: StoredImage[]) {
  if (images.length === 0) return
  const database = await openImageDatabase()
  try {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(IMAGE_STORE_NAME)
    images.forEach((image) => store.put(image))
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}

export async function getImage(id: string) {
  const database = await openImageDatabase()
  try {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readonly')
    return await requestToPromise<StoredImage | undefined>(transaction.objectStore(IMAGE_STORE_NAME).get(id))
  } finally {
    database.close()
  }
}

export async function listImages() {
  const database = await openImageDatabase()
  try {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readonly')
    return await requestToPromise<StoredImage[]>(transaction.objectStore(IMAGE_STORE_NAME).getAll())
  } finally {
    database.close()
  }
}

export async function deleteImages(ids: string[]) {
  if (ids.length === 0) return
  const database = await openImageDatabase()
  try {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(IMAGE_STORE_NAME)
    ids.forEach((id) => store.delete(id))
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}

export async function clearImages() {
  const database = await openImageDatabase()
  try {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite')
    transaction.objectStore(IMAGE_STORE_NAME).clear()
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}

export async function deleteOrphanImages(referencedIds: Set<string>) {
  const images = await listImages()
  await deleteImages(images.filter((image) => !referencedIds.has(image.id)).map((image) => image.id))
}
