import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Toaster, toast } from '@/components/ui/toast'
import { ThemeDrawer } from '@/components/theme-drawer'
import { ItemDialog, type ItemDialogState } from '@/components/item-dialog'
import { ThumbnailImage } from '@/components/thumbnail-image'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert01Icon,
  ArchiveIcon,
  ArrowUpRight01Icon,
  Delete01Icon,
  Edit01Icon,
  FileAddIcon,
  FolderAddIcon,
  FolderOpenIcon,
  Loading03Icon,
  More01Icon,
  Pdf02Icon,
  PlusSignIcon,
  RefreshIcon
} from '@hugeicons/core-free-icons'
import type { CatalogItem } from '../../shared/types'
import { generateThumbnail } from '@/lib/thumbnail'

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function App(): React.JSX.Element {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dialogState, setDialogState] = useState<ItemDialogState>(null)
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null)

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
          const thumb = await generateThumbnail(data)
          if (thumb) {
            const updated = await window.api.updateItem(item.id, {
              name: item.name,
              description: item.description,
              tags: item.tags,
              location: item.location,
              metadata: item.metadata,
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
    if (!deleteTarget) return
    try {
      await window.api.removeItem(deleteTarget.id)
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id))
      toast.add({
        title: 'Item deleted',
        description: `'${deleteTarget.name}' was removed.`,
        type: 'success'
      })
    } catch (e) {
      toast.add({ title: 'Delete failed', description: errorMessage(e), type: 'error' })
    }
    setDeleteTarget(null)
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4">
          <div className="flex items-baseline gap-2">
            <h1 className="font-heading text-base font-medium">Catalog</h1>
            <span className="text-xs text-muted-foreground">{items.length} item(s)</span>
          </div>
          <div className="flex items-center gap-1.5">
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
                Add
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddFile}>
                  <HugeiconsIcon icon={FileAddIcon} strokeWidth={2} />
                  Add file…
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImport} disabled={importing}>
                  <HugeiconsIcon
                    icon={importing ? Loading03Icon : FolderAddIcon}
                    strokeWidth={2}
                    className={importing ? 'animate-spin' : ''}
                  />
                  {importing ? 'Importing…' : 'Import folder…'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeDrawer />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-[3/4] animate-pulse bg-muted" />
                <CardContent className="p-3">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                </CardContent>
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
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
              <Card key={item.id} className="flex flex-col overflow-hidden">
                <div className="relative aspect-[3/4] w-full bg-muted">
                  {item.thumbnailExists && item.thumbnail ? (
                    <ThumbnailImage filePath={item.thumbnail} alt={item.name} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <HugeiconsIcon
                        icon={Pdf02Icon}
                        strokeWidth={1.5}
                        className="size-12 text-muted-foreground/50"
                      />
                    </div>
                  )}
                </div>
                <CardContent className="flex flex-1 flex-col gap-1.5 p-3">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="line-clamp-2 font-heading text-sm leading-tight font-medium">
                      {item.name}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-1 shrink-0" />
                        }
                      >
                        <HugeiconsIcon icon={More01Icon} strokeWidth={2} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => void handleOpen(item)}>
                          <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDialogState({ mode: 'edit', item })}>
                          <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {item.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  )}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {item.lastOpened > 0 && (
                    <p className="text-[11px] text-muted-foreground/70">
                      Last opened {formatDate(item.lastOpened)}
                    </p>
                  )}
                  {(!item.locationExists || !item.thumbnailExists) && (
                    <div className="mt-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-2">
                      <div className="flex items-start gap-1.5">
                        <HugeiconsIcon
                          icon={Alert01Icon}
                          strokeWidth={2}
                          className="mt-0.5 size-3.5 shrink-0 text-destructive"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-destructive">
                            {!item.locationExists ? 'File missing' : 'Thumbnail missing'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-destructive/90">
                            {!item.locationExists
                              ? `Couldn't find: ${item.location.split(/[\\/]/).pop()}`
                              : 'The thumbnail file is missing.'}
                          </p>
                        </div>
                      </div>
                      {!item.locationExists && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {item.repointCandidate && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleRepoint(item, item.repointCandidate!)}
                            >
                              Repoint
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleLocate(item)}
                          >
                            <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
                            Locate…
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
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
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{deleteTarget?.name}</span> and its thumbnail will be
              removed from the catalog. The PDF file itself is not deleted.
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

      <Toaster />
    </div>
  )
}

export default App
