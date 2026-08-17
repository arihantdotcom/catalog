import { app, dialog, ipcMain, shell } from 'electron'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'fs'
import { readFile } from 'fs/promises'
import { basename, dirname, extname, join, resolve } from 'path'
import { randomUUID } from 'crypto'
import type {
  CatalogItem,
  CatalogItemInput,
  ImportResult,
  OpenResult,
  RefreshResult
} from '../shared/types'
import { getDb } from './db'

type ItemRow = {
  id: number
  name: string
  description: string
  tags: string
  location: string
  thumbnail: string
  metadata: string
  last_opened: number
  created_at: number
  updated_at: number
}

function rowToItem(row: ItemRow): CatalogItem {
  const locationExists = existsSync(row.location)
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tags: safeJsonParse<string[]>(row.tags, []),
    location: row.location,
    thumbnail: row.thumbnail,
    metadata: row.metadata,
    lastOpened: row.last_opened,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    locationExists,
    thumbnailExists: row.thumbnail ? existsSync(row.thumbnail) : false,
    repointCandidate: locationExists ? null : findRepointCandidate(row.location, row.name)
  }
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function findRepointCandidate(location: string, name: string): string | null {
  const dir = dirname(location)
  if (!existsSync(dir)) return null
  const matches = readdirSync(dir).filter((f) => {
    if (extname(f).toLowerCase() !== '.pdf') return false
    return basename(f, extname(f)).toLowerCase() === name.toLowerCase()
  })
  return matches.length === 1 ? join(dir, matches[0]) : null
}

let thumbnailDir: string | null = null

function getThumbnailDir(): string {
  const dir = thumbnailDir ?? join(app.getPath('userData'), 'thumbnails')
  mkdirSync(dir, { recursive: true })
  return dir
}

function setThumbnailDir(newPath: string): void {
  const dir = newPath.trim()
  if (!dir) throw new Error('Directory path is required')
  mkdirSync(dir, { recursive: true })
  const old = getThumbnailDir()
  if (resolve(old) === resolve(dir)) return

  if (existsSync(old)) {
    for (const entry of readdirSync(old)) {
      const src = join(old, entry)
      const dest = join(dir, entry)
      try {
        renameSync(src, dest)
      } catch {
        copyFileSync(src, dest)
        unlinkSync(src)
      }
    }
    try {
      rmdirSync(old)
    } catch {
      // directory not empty or in use — leave it
    }
  }
  thumbnailDir = dir
  getDb()
    .prepare("UPDATE items SET thumbnail = replace(thumbnail, ?, ?) WHERE thumbnail LIKE ? || '%'")
    .run(old, dir, old)
}

function saveThumbnail(data: { mime: string; base64: string }): string {
  const ext = data.mime === 'image/png' ? 'png' : 'webp'
  const filePath = join(getThumbnailDir(), `${randomUUID()}.${ext}`)
  writeFileSync(filePath, Buffer.from(data.base64, 'base64'))
  return filePath
}

function deleteThumbnail(filePath: string): void {
  if (filePath && existsSync(filePath)) {
    try {
      unlinkSync(filePath)
    } catch {
      // thumbnail cleanup is best-effort
    }
  }
}

function insertItem(input: CatalogItemInput): CatalogItem {
  const db = getDb()
  const now = Date.now()
  const row = db
    .prepare(
      `INSERT INTO items (name, description, tags, location, thumbnail, metadata, last_opened, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
       RETURNING *`
    )
    .get(
      input.name,
      input.description,
      JSON.stringify(input.tags),
      input.location,
      input.thumbnailData ? saveThumbnail(input.thumbnailData) : '',
      input.metadata,
      now,
      now
    ) as unknown as ItemRow
  return rowToItem(row)
}

function updateItem(id: number, input: CatalogItemInput): CatalogItem {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow | undefined
  if (!existing) throw new Error('Item not found')

  let thumbnail = existing.thumbnail
  if (input.thumbnailData) {
    deleteThumbnail(existing.thumbnail)
    thumbnail = saveThumbnail(input.thumbnailData)
  }

  db.prepare(
    `UPDATE items
     SET name = ?, description = ?, tags = ?, location = ?, thumbnail = ?, metadata = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    input.name,
    input.description,
    JSON.stringify(input.tags),
    input.location,
    thumbnail,
    input.metadata,
    Date.now(),
    id
  )
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as unknown as ItemRow
  return rowToItem(row)
}

function listItems(): CatalogItem[] {
  const rows = getDb()
    .prepare('SELECT * FROM items ORDER BY created_at DESC')
    .all() as unknown as ItemRow[]
  return rows.map(rowToItem)
}

function validateInput(input: CatalogItemInput): void {
  if (!input.name.trim()) throw new Error('Name is required')
  if (!input.location.trim()) throw new Error('Location is required')
  if (!existsSync(input.location)) throw new Error(`File not found: ${input.location}`)
}

function collectPdfs(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    let stat
    try {
      stat = statSync(full)
    } catch {
      continue
    }
    if (stat.isDirectory()) {
      collectPdfs(full, out)
    } else if (stat.isFile() && extname(full).toLowerCase() === '.pdf') {
      out.push(full)
    }
  }
}

export function registerCatalogIpc(): void {
  ipcMain.handle('items:list', () => listItems())

  ipcMain.handle('items:create', (_e, input: CatalogItemInput) => {
    validateInput(input)
    return insertItem(input)
  })

  ipcMain.handle('items:update', (_e, id: number, input: CatalogItemInput) => {
    validateInput(input)
    return updateItem(id, input)
  })

  ipcMain.handle('items:remove', (_e, id: number) => {
    const db = getDb()
    const row = db.prepare('SELECT thumbnail FROM items WHERE id = ?').get(id) as
      { thumbnail: string } | undefined
    if (row) deleteThumbnail(row.thumbnail)
    db.prepare('DELETE FROM items WHERE id = ?').run(id)
  })

  ipcMain.handle('items:removeMany', (_e, ids: number[]) => {
    const db = getDb()
    for (const id of ids) {
      const row = db.prepare('SELECT thumbnail FROM items WHERE id = ?').get(id) as
        { thumbnail: string } | undefined
      if (row) deleteThumbnail(row.thumbnail)
      db.prepare('DELETE FROM items WHERE id = ?').run(id)
    }
  })

  ipcMain.handle('items:open', async (_e, id: number): Promise<OpenResult> => {
    const db = getDb()
    const row = db.prepare('SELECT location FROM items WHERE id = ?').get(id) as
      { location: string } | undefined
    if (!row) return { ok: false, error: 'Item not found' }
    if (!existsSync(row.location)) {
      return { ok: false, error: `File not found: ${row.location}` }
    }
    try {
      const result = await Promise.race([
        shell.openPath(row.location),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timed out waiting for the default application')), 8000)
        )
      ])
      if (result) return { ok: false, error: result }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
    db.prepare('UPDATE items SET last_opened = ? WHERE id = ?').run(Date.now(), id)
    return { ok: true }
  })

  ipcMain.handle('items:refresh', (): RefreshResult => {
    const items = listItems()
    return {
      items,
      missingLocations: items.filter((i) => !i.locationExists).length,
      missingThumbnails: items.filter((i) => !i.thumbnailExists).length
    }
  })

  ipcMain.handle('items:importDirectory', (_e, dir: string): ImportResult => {
    if (!dir || !existsSync(dir) || !statSync(dir).isDirectory()) {
      throw new Error('Directory not found')
    }
    const pdfs: string[] = []
    collectPdfs(dir, pdfs)
    pdfs.sort()

    const db = getDb()
    const existing = new Set(
      (db.prepare('SELECT location FROM items').all() as unknown as { location: string }[]).map(
        (r) => r.location
      )
    )

    const created: CatalogItem[] = []
    let skipped = 0
    for (const location of pdfs) {
      if (existing.has(location)) {
        skipped++
        continue
      }
      const createdItem = insertItem({
        name: basename(location, extname(location)),
        description: '',
        tags: [],
        location,
        metadata: '{}'
      })
      created.push(createdItem)
      existing.add(location)
    }
    return { created: created.length, skipped, items: created }
  })

  ipcMain.handle('dialog:pickPdf', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF files', extensions: ['pdf'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:pickDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('pdf:read', async (_e, filePath: string): Promise<ArrayBuffer> => {
    if (!filePath || !existsSync(filePath)) throw new Error(`File not found: ${filePath}`)
    const buf = await readFile(filePath)
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  })

  ipcMain.handle('thumb:read', (_e, filePath: string): string => {
    if (!filePath || !existsSync(filePath)) throw new Error(`Thumbnail not found: ${filePath}`)
    const buf = readFileSync(filePath)
    const mime = extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/webp'
    return `data:${mime};base64,${buf.toString('base64')}`
  })

  ipcMain.handle('app:getThumbnailDir', () => getThumbnailDir())

  ipcMain.handle('app:setThumbnailDir', (_e, dir: string) => {
    setThumbnailDir(dir)
    return getThumbnailDir()
  })
}
