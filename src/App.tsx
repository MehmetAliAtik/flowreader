import { useEffect, useState } from 'react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Sidebar, type AppView } from '@/components/Sidebar'
import { SettingsModal } from '@/components/SettingsModal'
import { ToastContainer } from '@/components/ui/Toast'
import { Library } from '@/pages/Library'
import { Reader } from '@/pages/Reader'
import { Home } from '@/pages/Home'
import { Stats } from '@/pages/Stats'
import { type Book } from '@/db/database'
import { useSettingsPersistence } from '@/hooks/useSettingsPersistence'
import { useResponsive } from '@/hooks/useResponsive'

function App() {
  const [view, setView]             = useState<AppView>('home')
  const [activeBook, setActiveBook] = useState<Book | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useSettingsPersistence()

  const { isNarrow } = useResponsive()

  // Ctrl+, → open settings
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ',' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setShowSettings((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function openBook(book: Book) {
    setActiveBook(book)
    setView('reader')
  }

  function goToLibrary() {
    setView('library')
    setActiveBook(null)
  }

  const showSidebar = view !== 'reader'

  return (
    <ThemeProvider>
      <div className="h-screen bg-surface text-ink transition-colors duration-200 flex overflow-hidden"
           style={{ flexDirection: isNarrow ? 'column' : 'row' }}>

        {/* Sidebar / top bar — hidden in reader */}
        {showSidebar && (
          isNarrow ? (
            <Sidebar
              currentView={view}
              onNavigate={setView}
              onOpenSettings={() => setShowSettings(true)}
            />
          ) : (
            <Sidebar
              currentView={view}
              onNavigate={setView}
              onOpenSettings={() => setShowSettings(true)}
            />
          )
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {view === 'home' && (
            <Home onOpenBook={openBook} onNavigateToLibrary={() => setView('library')} />
          )}
          {view === 'library' && (
            <Library onOpenBook={openBook} />
          )}
          {view === 'reader' && activeBook && (
            <Reader book={activeBook} onExit={goToLibrary} />
          )}
          {view === 'stats' && (
            <Stats />
          )}
        </main>
      </div>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <ToastContainer />
    </ThemeProvider>
  )
}

export default App
