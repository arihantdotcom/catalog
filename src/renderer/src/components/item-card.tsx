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
  const visibleTags = item.tags.slice(0, 2)

  return (
    <Card
      className={cn(
        'group relative isolate aspect-3/4 w-full overflow-hidden rounded-[1.4rem] bg-card p-0 shadow-[0_18px_35px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(15,23,42,0.12)]',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <div className="absolute inset-0">
        {item.thumbnailExists && item.thumbnail ? (
          <ThumbnailImage filePath={item.thumbnail} alt={item.name} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-r from-primary/20 to-secondary/20">
            <div className="rounded-[1.2rem] border border-foreground/10 bg-background/60 p-6 shadow-inner backdrop-blur-sm">
              <HugeiconsIcon
                icon={Pdf02Icon}
                strokeWidth={1.4}
                className="size-12 text-muted-foreground/60"
              />
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-linear-to-b from-black/5 via-transparent to-black/75" />

      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-end gap-2 p-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 cursor-pointer bg-black/20 text-white shadow-sm backdrop-blur-md hover:bg-black/30 hover:text-white"
            title="Open externally"
            onClick={() => onOpen(item)}
          >
            <HugeiconsIcon icon={ExternalLinkIcon} strokeWidth={2} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 cursor-pointer bg-black/20 text-white shadow-sm backdrop-blur-md hover:bg-black/30 hover:text-white"
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
      </div>

      <div className="absolute bottom-3 left-3 z-20">
        <button
          type="button"
          aria-pressed={selected}
          aria-label={selected ? 'Deselect item' : 'Select item'}
          onClick={() => onToggleSelect(item.id)}
          className={cn(
            'flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/25 text-white opacity-0 shadow-sm backdrop-blur-md transition-all duration-200 group-hover:opacity-100',
            selected && 'bg-primary text-primary-foreground opacity-100'
          )}
        >
          {selected && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3.5" />}
        </button>
      </div>

      {locationMissing && (
        <div className="absolute inset-x-3 top-12 z-20 flex flex-col gap-2 rounded-2xl bg-destructive/15 p-2.5 shadow-sm backdrop-blur-md">
          <div className="flex items-start gap-2">
            <HugeiconsIcon
              icon={Alert01Icon}
              strokeWidth={2}
              className="mt-0.5 size-3.5 shrink-0 text-destructive"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive">
                File missing
              </p>
              <p className="truncate text-[11px] text-destructive/90">
                {item.location.split(/[\\/]/).pop()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.repointCandidate && (
              <Button
                size="xs"
                variant="outline"
                className="h-6 bg-background/20 text-[10px] text-destructive hover:bg-destructive/10"
                onClick={() => onRepoint(item, item.repointCandidate!)}
              >
                Repoint
              </Button>
            )}
            <Button
              size="xs"
              variant="outline"
              className="h-6 bg-background/20 text-[10px] text-destructive hover:bg-destructive/10"
              onClick={() => onLocate(item)}
            >
              <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
              Locate
            </Button>
          </div>
        </div>
      )}

      {thumbnailMissing && !locationMissing && (
        <div className="absolute inset-x-3 top-12 z-20 rounded-full bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-medium text-amber-100 backdrop-blur-sm">
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
            Thumbnail missing
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-background/95 via-background/80 to-background/35 p-4 backdrop-blur-md">
        <div className="mb-2">
          <h3 className="line-clamp-2 font-heading text-[15px] leading-snug font-medium text-foreground">
            {item.name}
          </h3>
        </div>

        <p
          className={cn(
            'line-clamp-2 text-xs',
            item.description ? 'text-muted-foreground' : 'text-muted-foreground/60 italic'
          )}
        >
          {item.description || 'No description'}
        </p>

        {visibleTags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full px-2 py-0.5 text-[10px]">
                {tag
                  .split(' ')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-muted-foreground/60 italic">No tags</p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 pt-2 text-[11px] text-muted-foreground/80">
          <span>
            {item.lastOpened > 0 ? `Opened ${formatDate(item.lastOpened)}` : 'Never opened'}
          </span>
          <span>{item.location.split(/[\\/]/).pop()}</span>
        </div>
      </div>
    </Card>
  )
}
