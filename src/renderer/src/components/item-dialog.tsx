import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert01Icon, FolderOpenIcon, Loading03Icon } from '@hugeicons/core-free-icons'
import type { CatalogItem, CatalogItemInput, ThumbnailData } from '../../../shared/types'
import { generateCover } from '@/lib/cover'
import { pdfInfoToMetadata, type PdfInfo } from '@/lib/pdf-info'

export type ItemDialogState =
  { mode: 'create'; location?: string } | { mode: 'edit'; item: CatalogItem } | null

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function ItemForm({
  state,
  onClose,
  onSaved
}: {
  state: Exclude<ItemDialogState, null>
  onClose: () => void
  onSaved: (item: CatalogItem) => void
}): React.JSX.Element {
  const editing = state.mode === 'edit'
  const [name, setName] = useState(() =>
    editing ? state.item.name : (state.location?.split(/[\\/]/).pop() ?? '').replace(/\.pdf$/i, '')
  )
  const [description, setDescription] = useState(() => (editing ? state.item.description : ''))
  const [tagsText, setTagsText] = useState(() => (editing ? state.item.tags.join(', ') : ''))
  const [location, setLocation] = useState(() =>
    editing ? state.item.location : (state.location ?? '')
  )
  const [metadataText, setMetadataText] = useState(() => (editing ? state.item.metadata : '{}'))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [rendering, setRendering] = useState(false)

  const needsThumbnail = !editing || location !== state.item.location || !state.item.thumbnailExists

  const handleBrowse = async (): Promise<void> => {
    const path = await window.api.pickPdf()
    if (path) setLocation(path)
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    setError(null)
    try {
      const trimmedName = name.trim()
      if (!trimmedName) throw new Error('Name is required')
      if (!location) throw new Error('Location is required')
      let parsedMetadata: unknown
      try {
        parsedMetadata = JSON.parse(metadataText.trim() || '{}')
      } catch {
        throw new Error('Metadata must be valid JSON')
      }
      void parsedMetadata
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      let thumbnailData: ThumbnailData | null = null
      let pdfInfo: PdfInfo | null = null
      if (needsThumbnail) {
        setRendering(true)
        const data = await window.api.readPdf(location)
        const cover = await generateCover(data)
        thumbnailData = cover?.thumbnail ?? null
        pdfInfo = cover?.info ?? null
      }

      let finalName = trimmedName
      let finalDescription = description.trim()
      let finalTags = tags
      let finalMetadata = metadataText.trim() || '{}'

      if (pdfInfo) {
        if (editing) {
          if (!finalDescription && pdfInfo.subject) finalDescription = pdfInfo.subject
          if (finalTags.length === 0 && pdfInfo.keywords.length > 0) {
            finalTags = pdfInfo.keywords
          }
          if (finalMetadata === '{}') finalMetadata = pdfInfoToMetadata(pdfInfo)
        } else {
          const nameFromFile = (state.location?.split(/[\\/]/).pop() ?? '').replace(/\.pdf$/i, '')
          if (trimmedName === nameFromFile && pdfInfo.title) finalName = pdfInfo.title
          if (!finalDescription && pdfInfo.subject) finalDescription = pdfInfo.subject
          if (finalTags.length === 0 && pdfInfo.keywords.length > 0) {
            finalTags = pdfInfo.keywords
          }
          if (finalMetadata === '{}') finalMetadata = pdfInfoToMetadata(pdfInfo)
        }
      }

      const input: CatalogItemInput = {
        name: finalName,
        description: finalDescription,
        tags: finalTags,
        location,
        metadata: finalMetadata,
        thumbnailData
      }
      const saved =
        state.mode === 'edit'
          ? await window.api.updateItem(state.item.id, input)
          : await window.api.createItem(input)
      onSaved(saved)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setRendering(false)
      setSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{editing ? 'Edit item' : 'Add item'}</DialogTitle>
        <DialogDescription>
          {editing ? 'Update the details of this catalog entry.' : 'Add a new PDF to your catalog.'}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="item-name">Name</Label>
          <Input
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Document title"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="item-location">Location</Label>
          <div className="flex gap-1.5">
            <Input
              id="item-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="/path/to/file.pdf"
              readOnly
            />
            <Button variant="outline" size="icon" onClick={handleBrowse} title="Browse…">
              <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
            </Button>
          </div>
          {needsThumbnail && (
            <p className="text-xs text-muted-foreground">
              A thumbnail will be generated from the first page.
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="item-description">Description</Label>
          <Textarea
            id="item-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary"
            rows={2}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="item-tags">Tags</Label>
          <Input
            id="item-tags"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="physics, notes, exam"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="item-metadata">Metadata (JSON)</Label>
          <Textarea
            id="item-metadata"
            value={metadataText}
            onChange={(e) => setMetadataText(e.target.value)}
            rows={4}
            className="font-mono text-xs"
            spellCheck={false}
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} />
            <AlertTitle>Could not save</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && (
            <HugeiconsIcon icon={Loading03Icon} className="animate-spin" strokeWidth={2} />
          )}
          {saving ? (rendering ? 'Rendering thumbnail…' : 'Saving…') : 'Save'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function ItemDialog({
  state,
  onOpenChange,
  onSaved
}: {
  state: ItemDialogState
  onOpenChange: (open: boolean) => void
  onSaved: (item: CatalogItem) => void
}): React.JSX.Element {
  const handleClose = (): void => onOpenChange(false)
  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      {state && (
        <ItemForm
          key={state.mode === 'edit' ? `edit-${state.item.id}` : `create-${state.location ?? ''}`}
          state={state}
          onClose={handleClose}
          onSaved={onSaved}
        />
      )}
    </Dialog>
  )
}
