import { app } from 'electron'
import { DatabaseSync } from 'node:sqlite'
import { join } from 'path'

let db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(join(app.getPath('userData'), 'catalog.db'))
    db.exec('PRAGMA journal_mode = WAL;')
    db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL DEFAULT '[]',
        location TEXT NOT NULL,
        thumbnail TEXT NOT NULL DEFAULT '',
        metadata TEXT NOT NULL DEFAULT '{}',
        last_opened INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
  }
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
