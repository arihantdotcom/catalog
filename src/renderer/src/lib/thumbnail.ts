import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { ThumbnailData } from '../../../shared/types'

GlobalWorkerOptions.workerSrc = workerUrl

const THUMBNAIL_WIDTH = 400

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function generateThumbnail(data: ArrayBuffer): Promise<ThumbnailData | null> {
  try {
    const pdf = await getDocument({ data }).promise
    const page = await pdf.getPage(1)
    const base = page.getViewport({ scale: 1 })
    const scale = THUMBNAIL_WIDTH / base.width
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return null
    await page.render({ canvas, viewport }).promise
    await pdf.loadingTask.destroy()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.85)
    )
    if (!blob) return null
    return { mime: 'image/webp', base64: await blobToBase64(blob) }
  } catch {
    return null
  }
}
