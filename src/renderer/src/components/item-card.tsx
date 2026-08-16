import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ThumbnailImage } from '@/components/thumbnail-image'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert01Icon,
  ArrowUpRight01Icon,
  Delete01Icon,
  Edit01Icon,
  ExternalLinkIcon,
  FolderOpenIcon,
  MoreVerticalIcon,
  Pdf02Icon,
  Tick02Icon
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import type { CatalogItem } from '../../../shared/types'

type ItemCardProps = {
  item: CatalogItem
  selected?: boolean
  onToggleSelect: (id: number) => void
  onOpen: (item: CatalogItem) => void
  onEdit: (item: CatalogItem) => void
  onDelete: (item: CatalogItem) => void
  onRepoint: (item: CatalogItem, newLocation: string) => void
  onLocate: (item: CatalogItem) => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export function ItemCard({
  item,
  selected = false,
  onToggleSelect,
  onOpen,
  onEdit,
  onDelete,
  onRepoint,
  onLocate
}: ItemCardProps): React.JSX.Element {
  const locationMissing = !item.locationExists
  const thumbnailMissing = !item.thumbnailExists

  return (
    <Card
      className={cn(
        'group relative aspect-2/3 w-full p-0 transition-shadow',
        selected && 'ring-2 ring-primary'
      )}
    >
      <div className="absolute inset-0">
        {item.thumbnailExists && item.thumbnail ? (
          <ThumbnailImage filePath={item.thumbnail} alt={item.name} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <HugeiconsIcon
              icon={Pdf02Icon}
              strokeWidth={1.5}
              className="size-12 text-muted-foreground/50"
            />
          </div>
        )}
      </div>

      <div className="absolute top-2 left-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 cursor-pointer bg-background/50 backdrop-blur-sm"
          title="Open externally"
          onClick={() => onOpen(item)}
        >
          <HugeiconsIcon icon={ExternalLinkIcon} strokeWidth={2} />
        </Button>
      </div>

      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 cursor-pointer bg-background/50 backdrop-blur-sm"
              />
            }
          >
            <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpen(item)}>
              <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(item)}>
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="absolute bottom-3 left-3 z-10">
        <button
          type="button"
          aria-pressed={selected}
          aria-label={selected ? 'Deselect item' : 'Select item'}
          onClick={() => onToggleSelect(item.id)}
          className={cn(
            'flex size-6 cursor-pointer items-center justify-center rounded-full border bg-background/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100',
            selected && 'border-primary bg-primary text-primary-foreground opacity-100'
          )}
        >
          {selected && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3.5" />}
        </button>
      </div>

      {locationMissing && (
        <div className="absolute inset-x-0 top-0 flex flex-col gap-1.5 border-b border-destructive/30 bg-destructive/10 p-2 backdrop-blur-sm">
          <div className="flex items-start gap-1.5">
            <HugeiconsIcon
              icon={Alert01Icon}
              strokeWidth={2}
              className="mt-0.5 size-3.5 shrink-0 text-destructive"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-destructive">File missing</p>
              <p className="truncate text-[11px] text-destructive/90">
                {item.location.split(/[\\/]/).pop()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.repointCandidate && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[11px]"
                onClick={() => onRepoint(item, item.repointCandidate!)}
              >
                Repoint
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[11px]"
              onClick={() => onLocate(item)}
            >
              <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
              Locate…
            </Button>
          </div>
        </div>
      )}

      {thumbnailMissing && !locationMissing && (
        <div className="absolute inset-x-0 top-0 border-b border-destructive/30 bg-destructive/10 p-1.5 backdrop-blur-sm">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-destructive">
            <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
            Thumbnail missing — will regenerate on edit
          </p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex min-h-[50%] flex-col justify-end gap-1.5 border-t border-foreground/10 bg-background/60 p-3.5 backdrop-blur-md">
        <h3 className="line-clamp-2 font-heading text-[15px] leading-snug font-medium">{item.name}</h3>
        <p
          className={cn(
            'line-clamp-2 text-xs',
            item.description ? 'text-muted-foreground' : 'text-muted-foreground/60 italic'
          )}
        >
          {item.description || 'No description'}
        </p>
        {item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground/60 italic">No tags</p>
        )}
        <p className="text-[11px] text-muted-foreground/70">
          {item.lastOpened > 0 ? `Last opened ${formatDate(item.lastOpened)}` : 'Never opened'}
        </p>
      </div>
    </Card>
  )
}
