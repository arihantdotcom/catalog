import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeDrawer } from '@/components/theme-drawer'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8">
      <div className="fixed top-4 right-4">
        <ThemeDrawer />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>shadcn/ui + electron-vite</CardTitle>
          <CardDescription>
            Tailwind CSS v4, nova style, neutral theme with the Outfit + JetBrains Mono fonts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={ipcHandle}>Send IPC</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
