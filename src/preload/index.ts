import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  CatalogItem,
  CatalogItemInput,
  ImportResult,
  OpenResult,
  RefreshResult
} from '../shared/types'

// Custom APIs for renderer
const api = {
  listItems: (): Promise<CatalogItem[]> => ipcRenderer.invoke('items:list'),
  createItem: (input: CatalogItemInput): Promise<CatalogItem> =>
    ipcRenderer.invoke('items:create', input),
  updateItem: (id: number, input: CatalogItemInput): Promise<CatalogItem> =>
    ipcRenderer.invoke('items:update', id, input),
  removeItem: (id: number): Promise<void> => ipcRenderer.invoke('items:remove', id),
  removeMany: (ids: number[]): Promise<void> => ipcRenderer.invoke('items:removeMany', ids),
  openItem: (id: number): Promise<OpenResult> => ipcRenderer.invoke('items:open', id),
  refreshItems: (): Promise<RefreshResult> => ipcRenderer.invoke('items:refresh'),
  importDirectory: (dir: string): Promise<ImportResult> =>
    ipcRenderer.invoke('items:importDirectory', dir),
  pickPdf: (): Promise<string | null> => ipcRenderer.invoke('dialog:pickPdf'),
  pickDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:pickDirectory'),
  readPdf: (filePath: string): Promise<ArrayBuffer> => ipcRenderer.invoke('pdf:read', filePath),
  readThumbnail: (filePath: string): Promise<string> => ipcRenderer.invoke('thumb:read', filePath),
  getThumbnailDir: (): Promise<string> => ipcRenderer.invoke('app:getThumbnailDir'),
  setThumbnailDir: (dir: string): Promise<string> => ipcRenderer.invoke('app:setThumbnailDir', dir)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

export type CatalogApi = typeof api
