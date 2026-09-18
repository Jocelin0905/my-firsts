import { useFirstImage } from '../hooks/useFirstImage'

interface FirstImageProps {
  imageId?: string
  alt: string
  className?: string
}

export function FirstImage({ imageId, alt, className }: FirstImageProps) {
  const { url } = useFirstImage(imageId)
  if (!url) return <div className={className} aria-hidden="true" data-image-placeholder />
  return <img className={className} src={url} alt={alt} />
}
