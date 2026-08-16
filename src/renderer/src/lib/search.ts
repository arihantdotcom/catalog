import Fuse from 'fuse.js'
import type { CatalogItem } from '../../../shared/types'

export type SearchableItem = CatalogItem & { metadataValues: string[] }

function collectValues(node: unknown, out: string[]): void {
  if (node === null || node === undefined) return
  if (typeof node === 'string') {
    if (node.trim()) out.push(node.trim())
    return
  }
  if (typeof node === 'number' || typeof node === 'boolean') {
    out.push(String(node))
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) collectValues(item, out)
    return
  }
  if (typeof node === 'object') {
    for (const value of Object.values(node)) collectValues(value, out)
  }
}

export function extractMetadataValues(metadataJson: string): string[] {
  try {
    const parsed: unknown = JSON.parse(metadataJson)
    const out: string[] = []
    collectValues(parsed, out)
    return out
  } catch {
    return []
  }
}

export function createSearchIndex(items: CatalogItem[]): Fuse<SearchableItem> {
  const searchable: SearchableItem[] = items.map((item) => ({
    ...item,
    metadataValues: extractMetadataValues(item.metadata)
  }))
  return new Fuse(searchable, {
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'description', weight: 0.3 },
      { name: 'tags', weight: 0.2 },
      { name: 'metadataValues', weight: 0.1 }
    ],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2
  })
}

export function searchItems(fuse: Fuse<SearchableItem>, query: string): CatalogItem[] {
  return fuse.search(query).map((result) => result.item)
}