import { useEffect, useState } from 'react'
import { BookOpen, ArrowRight, Flame } from 'lucide-react'
import { db, type Book, type ReadingSession } from '@/db/database'
import { useSettingsStore } from '@/stores/settingsStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime } from '@/utils/formatTime'
import { getTodayMinutes, getCurrentStreak, getWeekData } from '@/utils/streakCalculator'
import { useImportBook } from '@/hooks/useImportBook'

interface HomeProps {
  onOpenBook: (book: Book) => void
  onNavigateToLibrary: () => void
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 22) return 'Good evening'
  return 'Late night reading?'
}

export function Home({ onOpenBook, onNavigateToLibrary }: HomeProps) {
  const { dailyGoal } = useSettingsStore()
  const [lastBook,   setLastBook]   = useState<Book | null>(null)
  const [recentBooks, setRecentBooks] = useState<Book[]>([])
  const [sessions,   setSessions]   = useState<ReadingSession[]>([])
  const [thumbUrls,  setThumbUrls]  = useState<Record<number, string>>({})
  const { importFromDialog, isLoading } = useImportBook(() => {})

  useEffect(() => {
    async function load() {
      const all = await db.books.toArray()
      const sorted = [...all].sort((a, b) => {
        if (!a.lastReadAt) return 1
        if (!b.lastReadAt) return -1
        return +new Date(b.lastReadAt) - +new Date(a.lastReadAt)
      })
      setLastBook(sorted[0] ?? null)
      setRecentBooks(sorted.slice(0, 4))

      const sess = await db.sessions.toArray()
      setSessions(sess)

      // Build thumb URLs
      const urls: Record<number, string> = {}
      for (const b of sorted.slice(0, 5)) {
        if (b.thumbnail) urls[b.id] = URL.createObjectURL(b.thumbnail)
      }
      setThumbUrls(urls)
    }
    load()
    return () => {
      Object.values(thumbUrls).forEach((u) => URL.revokeObjectURL(u))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const todayMinutes = getTodayMinutes(sessions)
  const streak       = getCurrentStreak(sessions, dailyGoal)
  const weekData     = getWeekData(sessions, dailyGoal)
  const goalProgress = Math.min(100, (todayMinutes / dailyGoal) * 100)

  const heroProgress = lastBook && lastBook.totalWords > 0
    ? Math.round((lastBook.lastWordIndex / lastBook.totalWords) * 100)
    : 0

  // No books — show empty state
  if (!lastBook) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-6 px-8 bg-surface"
        onDragOver={(e) => e.preventDefault()}
      >
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="text-ink-tertiary">
          <rect x="8" y="6" width="44" height="56" rx="4" stroke="currentColor" strokeWidth="2" />
          <line x1="18" y1="22" x2="42" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="31" x2="42" y2="31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="40" x2="32" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="56" cy="56" r="14" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
          <line x1="56" y1="49" x2="56" y2="63" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <line x1="49" y1="56" x2="63" y2="56" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <div className="text-center">
          <p className="text-xl font-serif font-semibold text-ink mb-1">Your reading space is empty</p>
          <p className="text-sm text-ink-tertiary">Import a PDF to start reading</p>
        </div>

        <Button onClick={importFromDialog} disabled={isLoading}>
          <BookOpen size={16} />
          {isLoading ? 'Importing…' : 'Import Book'}
        </Button>

        <p className="text-xs text-ink-ghost">or drag & drop a PDF here</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-10">

        {/* Greeting */}
        <div>
          <p className="text-sm text-ink-secondary mb-1">{getGreeting()}</p>
          <h1 className="text-3xl font-serif font-semibold text-ink leading-tight">
            Continue Reading
          </h1>
        </div>

        {/* Hero card */}
        <div className="flex gap-6 bg-surface-elevated rounded-modal shadow-warm p-6 paper-texture">
          {/* Thumbnail */}
          <div className="w-24 flex-shrink-0 rounded-lg overflow-hidden shadow-warm-sm"
               style={{ transform: 'rotate(1.5deg)' }}>
            {thumbUrls[lastBook.id] ? (
              <img src={thumbUrls[lastBook.id]} alt={lastBook.title} className="w-full h-36 object-cover" />
            ) : (
              <div className="w-full h-36 bg-surface-secondary flex items-center justify-center">
                <BookOpen size={28} className="text-ink-ghost" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-serif font-semibold text-ink leading-snug line-clamp-2 mb-1">
                {lastBook.title}
              </h2>
              <p className="text-sm text-ink-secondary mb-3">
                {heroProgress}% complete · {lastBook.totalWords.toLocaleString()} words
              </p>
              <ProgressBar value={heroProgress} height={6} className="max-w-xs mb-1" />
              {lastBook.lastReadAt && (
                <p className="text-xs text-ink-tertiary mt-1">
                  Last read {formatRelativeTime(lastBook.lastReadAt)}
                </p>
              )}
            </div>
            <div className="mt-4">
              <Button onClick={() => onOpenBook(lastBook)}>
                Continue
                <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        </div>

        {/* Recently read */}
        {recentBooks.length > 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="label-caps">Recently Opened</p>
              <button
                onClick={onNavigateToLibrary}
                className="text-xs text-accent hover:opacity-80 transition-opacity"
              >
                View all
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recentBooks.map((book) => {
                const pct = book.totalWords > 0
                  ? Math.round((book.lastWordIndex / book.totalWords) * 100)
                  : 0
                return (
                  <button
                    key={book.id}
                    onClick={() => onOpenBook(book)}
                    className="flex-shrink-0 w-[120px] text-left group"
                  >
                    <div className="w-full h-[160px] rounded-card bg-surface-secondary overflow-hidden shadow-warm-sm group-hover:-translate-y-0.5 group-hover:shadow-warm transition-all duration-150 mb-2">
                      {thumbUrls[book.id] ? (
                        <img src={thumbUrls[book.id]} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen size={20} className="text-ink-ghost" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-ink line-clamp-2 leading-tight mb-1">
                      {book.title}
                    </p>
                    <ProgressBar value={pct} height={3} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Streak & goal card */}
        <div className="bg-surface-secondary rounded-card p-6 paper-texture">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              {streak >= 3 && <Flame size={18} className="text-accent" />}
              <span className="text-base font-serif font-semibold text-ink">
                {streak > 0 ? `${streak} day streak` : 'Start a streak today'}
              </span>
            </div>
            <span className="text-sm font-mono text-ink-secondary">
              Today: {todayMinutes} min
            </span>
          </div>

          {/* 7-day dots */}
          <div className="flex gap-2 mb-4">
            {weekData.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <div
                  className={`rounded-full transition-all ${
                    day.isToday ? 'w-4 h-4' : 'w-3 h-3'
                  } ${
                    day.metGoal
                      ? 'bg-accent'
                      : day.isToday
                      ? 'border-2 border-accent'
                      : 'border-2 border-border'
                  }`}
                />
                <span className="text-[10px] text-ink-ghost">{day.label.slice(0, 1)}</span>
              </div>
            ))}
          </div>

          {/* Daily goal progress */}
          <div className="flex items-center justify-between text-xs text-ink-tertiary mb-1.5">
            <span>Daily goal: {dailyGoal} min</span>
            <span className="font-mono">{Math.round(goalProgress)}%</span>
          </div>
          <ProgressBar value={goalProgress} height={6} />
        </div>

      </div>
    </div>
  )
}
