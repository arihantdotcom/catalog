import { ElectronAPI } from '@electron-toolkit/preload'
import type { CatalogApi } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: CatalogApi
  }
}