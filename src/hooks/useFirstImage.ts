import { useEffect, useState } from 'react'
import { getImage } from '../storage/imageRepository'

export function useFirstImage(imageId?: string) {
  const [state, setState] = useState<{ imageId?: string; url: string | null; failed: boolean }>({
    imageId: undefined,
    url: null,
    failed: false,
  })

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null

    if (!imageId) return undefined

    void getImage(imageId)
      .then((image) => {
        if (!active) return
        if (!image) {
          setState({ imageId, url: null, failed: true })
          return
        }
        objectUrl = URL.createObjectURL(image.blob)
        setState({ imageId, url: objectUrl, failed: false })
      })
      .catch(() => {
        if (active) setState({ imageId, url: null, failed: true })
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageId])

  return state.imageId === imageId ? { url: state.url, failed: state.failed } : { url: null, failed: false }
}
