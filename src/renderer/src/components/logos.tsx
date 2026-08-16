import { HugeiconsIcon } from '@hugeicons/react'
import { ChromeIcon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
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

export { ElectronLogo, NodeJsLogo, ChromiumLogo }
