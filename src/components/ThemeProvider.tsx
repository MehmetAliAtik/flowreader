import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')

      const apply = (dark: boolean) => {
        if (dark) root.classList.add('dark')
        else root.classList.remove('dark')
      }

      apply(mq.matches)

      const listener = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }

    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  return <>{children}</>
}
