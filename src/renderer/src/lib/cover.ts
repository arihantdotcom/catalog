import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { ThumbnailData } from '../../../shared/types'
import { extractPdfInfoFromDocument, type PdfInfo } from './pdf-info'

GlobalWorkerOptions.workerSrc = workerUrl

const THUMBNAIL_WIDTH = 600
const COVER_TIMEOUT_MS = 60_000

export type CoverResult = {
  thumbnail: ThumbnailData | null
  info: PdfInfo | null
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function renderFirstPage(pdf: PDFDocumentProxy): Promise<ThumbnailData | null> {
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
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.92)
  )
  if (!blob) return null
  return { mime: 'image/webp', base64: await blobToBase64(blob) }
}

export async function generateCover(
  data: ArrayBuffer,
  timeoutMs = COVER_TIMEOUT_MS
): Promise<CoverResult | null> {
  try {
    const pdf = await getDocument({ data, disableAutoFetch: true }).promise
    try {
      const result = await Promise.race([
        (async (): Promise<CoverResult> => {
          const [thumbnail, info] = await Promise.all([
            renderFirstPage(pdf),
            extractPdfInfoFromDocument(pdf)
          ])
          return { thumbnail, info }
        })(),
        new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), timeoutMs))
      ])
      return result === 'timeout' ? null : result
    } finally {
      await pdf.loadingTask.destroy()
    }
  } catch {
    return null
  }
}
