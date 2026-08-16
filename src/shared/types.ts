export type CatalogItem = {
  id: number
  name: string
  description: string
  tags: string[]
  location: string
  thumbnail: string
  metadata: string
  lastOpened: number
  createdAt: number
  updatedAt: number
  locationExists: boolean
  thumbnailExists: boolean
  repointCandidate: string | null
}

export type ThumbnailData = {
  mime: string
  base64: string
}

export type CatalogItemInput = {
  name: string
  description: string
  tags: string[]
  location: string
  metadata: string
  thumbnailData?: ThumbnailData | null
}

export type OpenResult = {
  ok: boolean
  error?: string
}

export type ImportResult = {
  created: number
  skipped: number
  items: CatalogItem[]
}

export type RefreshResult = {
  items: CatalogItem[]
  missingLocations: number
  missingThumbnails: number
}
