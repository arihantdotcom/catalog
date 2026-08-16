import type { CatalogItem } from '../../../shared/types'
import { generateCover } from './cover'
import { pdfInfoToMetadata } from './pdf-info'

export type CoverProgress = {
  total: number
  done: number
  failed: number
}

export type CoverPipelineHandlers = {
  concurrency?: number
  onProgress?: (progress: CoverProgress) => void
  onItemUpdated?: (item: CatalogItem) => void
  onDone?: (progress: CoverProgress) => void
}

export async function runCoverPipeline(
  items: CatalogItem[],
  handlers: CoverPipelineHandlers
): Promise<void> {
  const concurrency = handlers.concurrency ?? 4
  let next = 0
  let done = 0
  let failed = 0
  const total = items.length
  const emit = (): void => handlers.onProgress?.({ total, done, failed })

  const processOne = async (item: CatalogItem): Promise<void> => {
    try {
      const data = await window.api.readPdf(item.location)
      const cover = await generateCover(data)
      if (cover?.thumbnail) {
        const updated = await window.api.updateItem(item.id, {
          name: item.name,
          description: item.description,
          tags: item.tags,
          location: item.location,
          metadata: cover.info ? pdfInfoToMetadata(cover.info) : item.metadata,
          thumbnailData: cover.thumbnail
        })
        handlers.onItemUpdated?.(updated)
      } else {
        failed++
      }
    } catch {
      failed++
    } finally {
      done++
      emit()
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, async (): Promise<void> => {
    while (next < total) {
      const index = next++
      await processOne(items[index])
    }
  })
  await Promise.all(workers)
  emit()
  handlers.onDone?.({ total, done, failed })
}
