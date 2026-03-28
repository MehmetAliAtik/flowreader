import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { applyAccentVars } from '@/utils/accentColors'

interface ThemeProviderProps {
  children: React.ReactNode
}

function isDarkActive(): boolean {
  return document.documentElement.classList.contains('dark')
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme       = useSettingsStore((s) => s.theme)
  const accentColor = useSettingsStore((s) => s.accentColor)

  // Handle dark/light class + accent CSS vars on theme change
  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (dark: boolean) => {
      if (dark) root.classList.add('dark')
      else      root.classList.remove('dark')
      applyAccentVars(accentColor, dark)
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mq.matches)
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches)
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }

    applyTheme(theme === 'dark')
  }, [theme, accentColor])

  // Re-apply accent vars when accent color changes (theme stays same)
  useEffect(() => {
    applyAccentVars(accentColor, isDarkActive())
  }, [accentColor])

  return <>{children}</>
}
