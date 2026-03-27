import { useState } from 'react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { useSettingsStore } from '@/stores/settingsStore'
import { Library } from '@/pages/Library'
import { type Book } from '@/db/database'
import { Moon, Sun, Monitor } from 'lucide-react'

type View = 'library' | 'reader'

function App() {
  const { theme, setTheme } = useSettingsStore()
  const [view, setView] = useState<View>('library')
  const [activeBook, setActiveBook] = useState<Book | null>(null)

  function openBook(book: Book) {
    setActiveBook(book)
    setView('reader')
  }

  function goToLibrary() {
    setView('library')
  }

  const themeIcons = {
    light: <Sun size={15} />,
    dark: <Moon size={15} />,
    system: <Monitor size={15} />,
  }

  const nextTheme = { light: 'dark', dark: 'system', system: 'light' } as const

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-cream text-dark-brown dark:bg-charcoal dark:text-off-white transition-colors duration-200 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-4 px-8 py-3.5 border-b border-current/10 flex-shrink-0 bg-cream/80 dark:bg-charcoal/80 backdrop-blur-sm">
          <button
            onClick={goToLibrary}
            className="text-lg font-bold tracking-tight hover:opacity-70 transition-opacity select-none"
          >
            FlowReader
          </button>

          {view === 'reader' && activeBook && (
            <>
              <span className="opacity-25 text-sm">/</span>
              <span className="text-sm opacity-55 truncate max-w-xs">{activeBook.title}</span>
            </>
          )}

          <div className="flex-1" />

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(nextTheme[theme])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-current/15 bg-current/5 hover:bg-current/10 transition-colors text-sm font-medium"
            title={`Theme: ${theme}`}
          >
            {themeIcons[theme]}
            <span className="capitalize text-xs opacity-70">{theme}</span>
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {view === 'library' && <Library onOpenBook={openBook} />}
          {view === 'reader' && activeBook && (
            <div className="flex-1 flex items-center justify-center opacity-40">
              <div className="text-center">
                <p className="text-lg font-medium">{activeBook.title}</p>
                <p className="text-sm mt-2">Reader coming in Phase 4</p>
                <button
                  onClick={goToLibrary}
                  className="mt-4 px-4 py-2 rounded-lg bg-current/10 text-sm hover:bg-current/15 transition-colors"
                >
                  ← Back to Library
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
