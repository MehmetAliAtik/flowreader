import { useState } from 'react'
import {
  Home, BookOpen, BarChart3, Settings,
  Sun, Moon, Monitor, Pin, PinOff,
  BookMarked,
} from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useResponsive } from '@/hooks/useResponsive'

export type AppView = 'home' | 'library' | 'reader' | 'stats'

interface SidebarProps {
  currentView: AppView
  onNavigate: (view: AppView) => void
  onOpenSettings: () => void
}

const NAV_ITEMS = [
  { view: 'home'    as AppView, icon: Home,      label: 'Home' },
  { view: 'library' as AppView, icon: BookOpen,  label: 'Library' },
  { view: 'stats'   as AppView, icon: BarChart3, label: 'Stats' },
]

const THEME_SEQUENCE = { light: 'dark', dark: 'system', system: 'light' } as const

export function Sidebar({ currentView, onNavigate, onOpenSettings }: SidebarProps) {
  const { theme, setTheme, sidebarPinned, setSidebarPinned } = useSettingsStore()
  const { isWide, isNarrow } = useResponsive()
  const [hovered, setHovered] = useState(false)

  const expanded = isWide ? (sidebarPinned || hovered) : (sidebarPinned || hovered)
  const showLabels = expanded && !isNarrow

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  // ── Narrow: top bar ──────────────────────────────────────────────
  if (isNarrow) {
    return (
      <header className="flex items-center gap-1 px-4 h-12 bg-surface-secondary border-b border-border flex-shrink-0">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 mr-3"
        >
          <BookMarked size={20} className="text-accent" />
        </button>

        {NAV_ITEMS.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentView === view
                ? 'bg-accent-soft text-accent'
                : 'text-ink-tertiary hover:text-ink hover:bg-ink/8'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}

        <div className="flex-1" />
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-ink-tertiary hover:text-ink hover:bg-ink/8 transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => setTheme(THEME_SEQUENCE[theme])}
          className="p-2 rounded-lg text-ink-tertiary hover:text-ink hover:bg-ink/8 transition-colors"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon size={16} />
        </button>
      </header>
    )
  }

  // ── Side bar ─────────────────────────────────────────────────────
  return (
    <aside
      className="flex flex-col h-full bg-surface-secondary border-r border-border flex-shrink-0 transition-all duration-200 overflow-hidden"
      style={{ width: showLabels ? 200 : 64 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 px-4 flex-shrink-0 ${showLabels ? 'gap-3' : 'justify-center'}`}>
        <BookMarked size={22} className="text-accent flex-shrink-0" />
        {showLabels && (
          <span className="text-sm font-serif font-semibold text-ink truncate">FlowReader</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-2">
        {NAV_ITEMS.map(({ view, icon: Icon, label }) => {
          const active = currentView === view
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              title={!showLabels ? label : undefined}
              className={`flex items-center h-10 rounded-xl transition-all duration-150 ${
                showLabels ? 'gap-3 px-3' : 'justify-center px-0'
              } ${
                active
                  ? 'bg-accent-soft text-accent'
                  : 'text-ink-tertiary hover:text-ink hover:bg-ink/8'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {showLabels && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col gap-1 px-2 pb-4">
        {/* Pin toggle */}
        <button
          onClick={() => setSidebarPinned(!sidebarPinned)}
          title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          className={`flex items-center h-9 rounded-xl transition-colors ${
            showLabels ? 'gap-3 px-3' : 'justify-center px-0'
          } text-ink-ghost hover:text-ink-tertiary hover:bg-ink/6`}
        >
          {sidebarPinned ? <PinOff size={16} /> : <Pin size={16} />}
          {showLabels && (
            <span className="text-xs truncate">{sidebarPinned ? 'Unpin' : 'Pin'}</span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title={!showLabels ? 'Settings' : undefined}
          className={`flex items-center h-10 rounded-xl transition-colors ${
            showLabels ? 'gap-3 px-3' : 'justify-center px-0'
          } text-ink-tertiary hover:text-ink hover:bg-ink/8`}
        >
          <Settings size={18} className="flex-shrink-0" />
          {showLabels && <span className="text-sm font-medium">Settings</span>}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(THEME_SEQUENCE[theme])}
          title={`Theme: ${theme}`}
          className={`flex items-center h-10 rounded-xl transition-colors ${
            showLabels ? 'gap-3 px-3' : 'justify-center px-0'
          } text-ink-tertiary hover:text-ink hover:bg-ink/8`}
        >
          <ThemeIcon size={18} className="flex-shrink-0" />
          {showLabels && (
            <span className="text-sm font-medium capitalize">{theme}</span>
          )}
        </button>
      </div>
    </aside>
  )
}
