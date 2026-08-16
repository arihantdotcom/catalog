import { HugeiconsIcon } from '@hugeicons/react'
import { ChromeIcon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import catalog from '@/assets/app-logos/catalog.svg'
import catalogNameDark from '@/assets/app-logos/catalog-name-dark.svg'
import catalogNameLight from '@/assets/app-logos/catalog-name-light.svg'
import electronLogo from '@/assets/logos/electron.svg'
import nodeJsLogo from '@/assets/logos/node-js.svg'

type LogoProps = {
  className?: string
}

function ElectronLogo({ className }: LogoProps): React.JSX.Element {
  return <img src={electronLogo} alt="Electron" className={cn('size-4 dark:invert', className)} />
}

function NodeJsLogo({ className }: LogoProps): React.JSX.Element {
  return <img src={nodeJsLogo} alt="Node.js" className={cn('size-4 dark:invert', className)} />
}

function ChromiumLogo({ className }: LogoProps): React.JSX.Element {
  return <HugeiconsIcon icon={ChromeIcon} className={cn('size-4', className)} />
}

function CatalogLogo({ className }: LogoProps): React.JSX.Element {
  return <img src={catalog} alt="Catalog" className={cn('size-6', className)} />
}

function CatalogNameLogo({ className }: LogoProps): React.JSX.Element {
  return (
    <>
      <img
        src={catalogNameDark}
        alt="Catalog"
        className={cn('h-7 w-auto dark:hidden', className)}
      />
      <img
        src={catalogNameLight}
        alt="Catalog"
        className={cn('hidden h-7 w-auto dark:block', className)}
      />
    </>
  )
}

export { ElectronLogo, NodeJsLogo, ChromiumLogo, CatalogLogo, CatalogNameLogo }
