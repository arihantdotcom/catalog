import { useEffect, useState } from 'react'

export function ThumbnailImage({
  filePath,
  alt
}: {
  filePath: string
  alt: string
}): React.JSX.Element {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    window.api
      .readThumbnail(filePath)
      .then((data) => {
        if (!cancelled) setSrc(data)
      })
      .catch(() => {
        if (!cancelled) setSrc(null)
      })
    return () => {
      cancelled = true
    }
  }, [filePath])

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      </div>
    )
  }

  return <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />
}
