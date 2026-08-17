import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Delete01Icon,
  FolderOpenIcon,
  LaptopIcon,
  MoonIcon,
  Settings01Icon,
  Sun01Icon
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { ElectronLogo, NodeJsLogo, ChromiumLogo } from '@/components/assets'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer'
import { useTheme, type Theme } from '@/components/theme-provider'

const themes: { value: Theme; label: string; icon: typeof Sun01Icon }[] = [
  { value: 'light', label: 'Light', icon: Sun01Icon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: LaptopIcon }
]

const runtimes = [
  {
    value: 'electron',
    versionKey: 'electron',
    name: 'Electron',
    icon: ElectronLogo,
    description: 'Cross-platform runtime powering the app shell.'
  },
  {
    value: 'chromium',
    versionKey: 'chrome',
    name: 'Chromium',
    icon: ChromiumLogo,
    description: 'Rendering engine that paints the interface.'
  },
  {
    value: 'node',
    versionKey: 'node',
    name: 'Node',
    icon: NodeJsLogo,
    description: 'JavaScript runtime for the main process.'
  }
] as const

function ThemeDrawer({
  open,
  onOpenChange,
  itemsCount,
  onClearAll
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemsCount: number
  onClearAll: () => void
}): React.JSX.Element {
  const { theme, setTheme } = useTheme()
  const [versions] = useState(() => window.electron.process.versions)
  const [thumbnailDir, setThumbnailDir] = useState('')

  useEffect(() => {
    if (!open) return
    window.api
      .getThumbnailDir()
      .then(setThumbnailDir)
      .catch((e) =>
        toast.add({ title: 'Failed to read storage', description: String(e), type: 'error' })
      )
  }, [open])

  const handleChangeThumbnailDir = async (): Promise<void> => {
    try {
      const dir = await window.api.pickDirectory()
      if (!dir) return
      const updated = await window.api.setThumbnailDir(dir)
      setThumbnailDir(updated)
      toast.add({
        title: 'Storage location updated',
        description: 'Thumbnails will be stored in the new location.',
        type: 'success'
      })
    } catch (e) {
      toast.add({ title: 'Failed to change storage', description: String(e), type: 'error' })
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-8 h-8 rounded-md">
          <HugeiconsIcon icon={Settings01Icon} />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="mx-auto w-full max-w-md">
        <DrawerHeader>
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>Select a theme for the app.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-row gap-1 px-4 pt-2 justify-evenly">
          {themes.map(({ value, label, icon }) => (
            <Button
              key={value}
              variant={theme === value ? 'secondary' : 'ghost'}
              className="flex-1 h-20 gap-2 m-2 p-2"
              onClick={() => setTheme(value)}
            >
              <HugeiconsIcon icon={icon} />
              {label}
            </Button>
          ))}
        </div>
        <div className="px-4 pt-4 pb-2">
          <p className="font-heading text-xs font-medium text-muted-foreground">Data</p>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Clear catalog</p>
              <p className="text-xs text-muted-foreground">
                {itemsCount} item(s) and their thumbnails will be removed
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              disabled={itemsCount === 0}
              onClick={onClearAll}
            >
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
              Clear all
            </Button>
          </div>
        </div>
        <div className="px-4 pt-4 pb-2">
          <p className="font-heading text-xs font-medium text-muted-foreground">Storage</p>
          <div className="mt-2 flex flex-col gap-2 rounded-xl border bg-muted/40 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Thumbnails & covers</p>
              <p className="truncate text-xs text-muted-foreground" title={thumbnailDir}>
                {thumbnailDir || 'Loading…'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleChangeThumbnailDir}>
              <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
              Change location…
            </Button>
          </div>
        </div>
        <div className="px-4 pt-4 pb-2">
          <p className="font-heading text-xs font-medium text-muted-foreground">About this app</p>
          <Accordion defaultValue={['electron']}>
            {runtimes.map(({ value, versionKey, name, icon: Icon, description }) => (
              <AccordionItem key={value} value={value}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    {name}
                  </span>
                  <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
                    v{versions[versionKey]}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{description}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export { ThemeDrawer }
