import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Toaster, toast } from '@/components/ui/toast'
import { ThemeDrawer } from '@/components/theme-drawer'
import { CatalogNameLogo } from '@/components/assets'
import { ItemDialog, type ItemDialogState } from '@/components/item-dialog'
import { ItemCard } from '@/components/item-card'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArchiveIcon,
  Cancel01Icon,
  FileAddIcon,
  FolderAddIcon,
  Loading03Icon,
  PlusSignIcon,
  RefreshIcon,
  Search01Icon
} from '@hugeicons/core-free-icons'
import type { CatalogItem } from '../../shared/types'
import { generateThumbnail } from '@/lib/thumbnail'
import { extractPdfInfo, pdfInfoToMetadata } from '@/lib/pdf-info'
import { createSearchIndex, searchItems } from '@/lib/search'

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function App(): React.JSX.Element {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dialogState, setDialogState] = useState<ItemDialogState>(null)
  const [deleteTargets, setDeleteTargets] = useState<CatalogItem[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [query, setQuery] = useState('')

  const fuse = useMemo(() => createSearchIndex(items), [items])
  const displayItems = useMemo(() => {
    const q = query.trim()
    return q ? searchItems(fuse, q) : items
  }, [fuse, query, items])

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds]
  )

  const toggleSelect = (id: number): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearSelection = (): void => setSelectedIds(new Set())

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') clearSelection()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async (): Promise<void> => {
      try {
        const res = await window.api.refreshItems()
        if (cancelled) return
        setItems(res.items)
        if (res.missingLocations === 0 && res.missingThumbnails === 0) {
          toast.add({
            title: 'All items OK',
            description: `${res.items.length} item(s) in your catalog.`,
            type: 'success',
            timeout: 4000
          })
        } else {
          toast.add({
            title: 'Some items need attention',
            description: `${res.missingLocations} missing location(s), ${res.missingThumbnails} missing thumbnail(s).`,
            type: 'warning',
            timeout: 7000
          })
        }
      } catch (e) {
        if (!cancelled) {
          toast.add({
            title: 'Failed to load catalog',
            description: errorMessage(e),
            type: 'error'
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true)
    try {
      const res = await window.api.refreshItems()
      setItems(res.items)
      if (res.missingLocations === 0 && res.missingThumbnails === 0) {
        toast.add({
          title: 'All items OK',
          description: `${res.items.length} item(s) checked.`,
          type: 'success'
        })
      } else {
        toast.add({
          title: 'Some items need attention',
          description: `${res.missingLocations} missing location(s), ${res.missingThumbnails} missing thumbnail(s).`,
          type: 'warning',
          timeout: 7000
        })
      }
    } catch (e) {
      toast.add({ title: 'Refresh failed', description: errorMessage(e), type: 'error' })
    } finally {
      setRefreshing(false)
    }
  }

  const handleAddFile = async (): Promise<void> => {
    const path = await window.api.pickPdf()
    if (path) setDialogState({ mode: 'create', location: path })
  }

  const handleImport = async (): Promise<void> => {
    const dir = await window.api.pickDirectory()
    if (!dir) return
    setImporting(true)
    try {
      const res = await window.api.importDirectory(dir)
      setItems((prev) => [...res.items, ...prev])
      if (res.created === 0) {
        toast.add({
          title: 'Nothing to import',
          description: `All ${res.skipped} PDF(s) in that folder were already in the catalog.`,
          type: 'info'
        })
      } else {
        toast.add({
          title: 'Import complete',
          description: `Added ${res.created} PDF(s), skipped ${res.skipped}. Generating thumbnails…`,
          type: 'success'
        })
      }
      let ok = 0
      for (const item of res.items) {
        try {
          const data = await window.api.readPdf(item.location)
          const [thumb, pdfInfo] = await Promise.all([
            generateThumbnail(data),
            extractPdfInfo(data)
          ])
          if (thumb || pdfInfo) {
            const updated = await window.api.updateItem(item.id, {
              name: item.name,
              description: item.description,
              tags: item.tags,
              location: item.location,
              metadata: pdfInfo ? pdfInfoToMetadata(pdfInfo) : item.metadata,
              thumbnailData: thumb
            })
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
            ok++
          }
        } catch {
          // keep going, failed thumbnails stay missing
        }
      }
      toast.add({
        title: 'Thumbnails ready',
        description: `Generated thumbnails for ${ok} of ${res.items.length} item(s).`,
        type: 'success'
      })
    } catch (e) {
      toast.add({ title: 'Import failed', description: errorMessage(e), type: 'error' })
    } finally {
      setImporting(false)
    }
  }

  const handleOpen = async (item: CatalogItem): Promise<void> => {
    const res = await window.api.openItem(item.id)
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, lastOpened: Date.now() } : i)))
    } else {
      toast.add({ title: 'Could not open', description: res.error, type: 'error' })
    }
  }

  const handleRepoint = async (item: CatalogItem, newLocation: string): Promise<void> => {
    try {
      const data = await window.api.readPdf(newLocation)
      const thumb = await generateThumbnail(data)
      const updated = await window.api.updateItem(item.id, {
        name: item.name,
        description: item.description,
        tags: item.tags,
        location: newLocation,
        metadata: item.metadata,
        thumbnailData: thumb
      })
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      toast.add({
        title: 'Location repaired',
        description: `'${updated.name}' now points to the found file.`,
        type: 'success'
      })
    } catch (e) {
      toast.add({ title: 'Repair failed', description: errorMessage(e), type: 'error' })
    }
  }

  const handleLocate = async (item: CatalogItem): Promise<void> => {
    const path = await window.api.pickPdf()
    if (path) await handleRepoint(item, path)
  }

  const handleSaved = (item: CatalogItem): void => {
    toast.add({
      title: dialogState?.mode === 'edit' ? 'Item updated' : 'Item added',
      description: `'${item.name}'`,
      type: 'success'
    })
    setItems((prev) =>
      dialogState?.mode === 'edit'
        ? prev.map((i) => (i.id === item.id ? item : i))
        : [item, ...prev]
    )
    setDialogState(null)
  }

  const handleDelete = async (): Promise<void> => {
    if (!deleteTargets || deleteTargets.length === 0) return
    try {
      await window.api.removeMany(deleteTargets.map((i) => i.id))
      const removed = new Set(deleteTargets.map((i) => i.id))
      setItems((prev) => prev.filter((i) => !removed.has(i.id)))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const id of removed) next.delete(id)
        return next
      })
      toast.add({
        title: deleteTargets.length === 1 ? 'Item deleted' : 'Items deleted',
        description:
          deleteTargets.length === 1
            ? `'${deleteTargets[0].name}' was removed.`
            : `${deleteTargets.length} item(s) were removed.`,
        type: 'success'
      })
    } catch (e) {
      toast.add({ title: 'Delete failed', description: errorMessage(e), type: 'error' })
    }
    setDeleteTargets(null)
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4">
          <div className="flex shrink-0 items-center gap-2">
            <CatalogNameLogo />
            <span className="text-xs text-muted-foreground">
              {query.trim()
                ? `${displayItems.length} of ${items.length} item(s)`
                : `${items.length} item(s)`}
            </span>
          </div>
          <div className="relative w-full max-w-md">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, description, tags, metadata…"
              className="h-9 pl-8"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh"
            >
              <HugeiconsIcon
                icon={refreshing ? Loading03Icon : RefreshIcon}
                strokeWidth={2}
                className={refreshing ? 'animate-spin' : ''}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                Import
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddFile}>
                  <HugeiconsIcon icon={FileAddIcon} strokeWidth={2} />
                  File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImport} disabled={importing}>
                  <HugeiconsIcon
                    icon={importing ? Loading03Icon : FolderAddIcon}
                    strokeWidth={2}
                    className={importing ? 'animate-spin' : ''}
                  />
                  {importing ? 'Importing' : 'Bulk'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeDrawer />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="relative aspect-[3/4] w-full overflow-hidden p-0">
                <div className="absolute inset-0 animate-pulse bg-muted" />
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
              <HugeiconsIcon
                icon={ArchiveIcon}
                strokeWidth={1.5}
                className="size-8 text-muted-foreground"
              />
            </div>
            <div>
              <h2 className="font-heading text-base font-medium">Your catalog is empty</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Add a single PDF or import an entire folder to get started.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddFile}>
                <HugeiconsIcon icon={FileAddIcon} strokeWidth={2} />
                Add file…
              </Button>
              <Button variant="outline" onClick={handleImport}>
                <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
                Import folder…
              </Button>
            </div>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <p className="font-heading text-base font-medium">No matches</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Nothing matches “{query.trim()}” — try different terms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onOpen={handleOpen}
                onEdit={(i) => setDialogState({ mode: 'edit', item: i })}
                onDelete={(i) => setDeleteTargets([i])}
                onRepoint={handleRepoint}
                onLocate={handleLocate}
              />
            ))}
          </div>
        )}
      </main>

      <ItemDialog
        state={dialogState}
        onOpenChange={(o) => !o && setDialogState(null)}
        onSaved={handleSaved}
      />

      <AlertDialog
        open={deleteTargets !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargets(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTargets !== null && deleteTargets.length === 1
                ? 'Delete item?'
                : `Delete ${deleteTargets?.length ?? 0} items?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargets !== null && deleteTargets.length === 1 ? (
                <>
                  <span className="font-medium">{deleteTargets[0].name}</span> and its thumbnail
                  will be removed from the catalog. The PDF file itself is not deleted.
                </>
              ) : (
                <>
                  {deleteTargets?.length ?? 0} item(s) and their thumbnails will be removed from the
                  catalog. The PDF files themselves are not deleted.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-popover/80 px-3 py-2 shadow-lg backdrop-blur-md">
          <span className="text-xs font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="destructive" onClick={() => setDeleteTargets(selectedItems)}>
            Delete
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={clearSelection} title="Clear selection">
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Button>
        </div>
      )}

      <Toaster />
    </div>
  )
}

export default App
