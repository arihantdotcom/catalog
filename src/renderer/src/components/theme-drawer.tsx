import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Atom01Icon,
  ChromeIcon,
  LaptopIcon,
  MoonIcon,
  Sun01Icon,
  TerminalIcon,
  Settings01Icon,
  Tick02Icon
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
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
    icon: Atom01Icon,
    description: 'Cross-platform runtime powering the app shell.'
  },
  {
    value: 'chromium',
    versionKey: 'chrome',
    name: 'Chromium',
    icon: ChromeIcon,
    description: 'Rendering engine that paints the interface.'
  },
  {
    value: 'node',
    versionKey: 'node',
    name: 'Node',
    icon: TerminalIcon,
    description: 'JavaScript runtime for the main process.'
  }
] as const

function ThemeDrawer(): React.JSX.Element {
  const { theme, setTheme } = useTheme()
  const [versions] = useState(() => window.electron.process.versions)

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-8 h-8 rounded-full">
          <HugeiconsIcon icon={Settings01Icon} />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="mx-auto w-full max-w-md">
        <DrawerHeader>
          <DrawerTitle>Appearance</DrawerTitle>
          <DrawerDescription>Select a theme for the app.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-row gap-1.5 px-4 pt-2">
          {themes.map(({ value, label, icon }) => (
            <Button
              key={value}
              variant={theme === value ? 'secondary' : 'ghost'}
              className="justify-center h-20 gap-2 m-2 p-2"
              onClick={() => setTheme(value)}
            >
              <HugeiconsIcon icon={icon} />
              {label}
              {theme === value && <HugeiconsIcon icon={Tick02Icon} className="ml-auto" />}
            </Button>
          ))}
        </div>
        <div className="px-4 pt-4 pb-2">
          <p className="font-heading text-xs font-medium text-muted-foreground">About this app</p>
          <Accordion defaultValue={['electron']}>
            {runtimes.map(({ value, versionKey, name, icon, description }) => (
              <AccordionItem key={value} value={value}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <HugeiconsIcon icon={icon} className="text-muted-foreground" />
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
