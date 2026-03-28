import { useEffect, useState } from 'react'
import { db, type ReadingSession, type Book } from '@/db/database'
import { getWeekData } from '@/utils/streakCalculator'
import { useSettingsStore } from '@/stores/settingsStore'

interface StatCard {
  label: string
  value: string
  sub?: string
}

function calcStats(sessions: ReadingSession[], books: Book[]) {
  const totalMs = sessions.reduce((s, r) => s + r.durationMs, 0)
  const totalWords = sessions.reduce((s, r) => s + r.wordsRead, 0)
  const totalMinutes = totalMs / 60_000
  const avgWpm = sessions.length > 0
    ? Math.round(sessions.reduce((s, r) => s + r.avgWpm, 0) / sessions.length)
    : 0

  const finishedBooks = books.filter(
    (b) => b.totalWords > 0 && b.lastWordIndex >= b.totalWords - 1,
  ).length

  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  return [
    { label: 'Books Finished', value: String(finishedBooks) },
    { label: 'Words Read', value: totalWords >= 1_000_000
        ? `${(totalWords / 1_000_000).toFixed(1)}M`
        : totalWords >= 1_000
        ? `${(totalWords / 1_000).toFixed(1)}K`
        : String(totalWords) },
    { label: 'Time Reading', value: timeStr },
    { label: 'Avg Speed', value: avgWpm > 0 ? `${avgWpm} wpm` : '—' },
  ] satisfies StatCard[]
}

export function Stats() {
  const { dailyGoal } = useSettingsStore()
  const [sessions, setSessions] = useState<ReadingSession[]>([])
  const [books,    setBooks]    = useState<Book[]>([])

  useEffect(() => {
    async function load() {
      const [s, b] = await Promise.all([db.sessions.toArray(), db.books.toArray()])
      setSessions(s)
      setBooks(b)
    }
    load()
  }, [])

  const weekData  = getWeekData(sessions, dailyGoal)
  const statCards = calcStats(sessions, books)
  const maxMinutes = Math.max(...weekData.map((d) => d.minutes), 1)

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-10">

        {/* Heading */}
        <div>
          <p className="text-sm text-ink-secondary mb-1">Overview</p>
          <h1 className="text-3xl font-serif font-semibold text-ink leading-tight">
            Reading Stats
          </h1>
        </div>

        {/* This Week */}
        <div className="bg-surface-elevated rounded-modal shadow-warm p-6 paper-texture">
          <p className="label-caps mb-6">This Week</p>
          <div className="flex items-end gap-3 h-40">
            {weekData.map((day) => {
              const pct = Math.max(4, (day.minutes / maxMinutes) * 100)
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-ink-ghost font-mono">
                    {day.minutes > 0 ? `${day.minutes}m` : ''}
                  </span>
                  <div className="w-full flex flex-col justify-end" style={{ height: 96 }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        day.metGoal
                          ? 'bg-accent'
                          : day.isToday
                          ? 'bg-accent/50'
                          : 'bg-surface-secondary'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${
                    day.isToday ? 'text-accent' : 'text-ink-tertiary'
                  }`}>
                    {day.label.slice(0, 3)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
              <span className="text-xs text-ink-tertiary">Goal met</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-surface-secondary border border-border" />
              <span className="text-xs text-ink-tertiary">Below goal</span>
            </div>
            <span className="ml-auto text-xs text-ink-ghost">Daily goal: {dailyGoal} min</span>
          </div>
        </div>

        {/* All Time */}
        <div>
          <p className="label-caps mb-4">All Time</p>
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="bg-surface-elevated rounded-card p-5 shadow-warm paper-texture"
              >
                <p className="text-3xl font-mono font-semibold text-ink mb-1">
                  {card.value}
                </p>
                <p className="text-xs text-ink-tertiary">{card.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions list — last 10 */}
        {sessions.length > 0 && (
          <div>
            <p className="label-caps mb-4">Recent Sessions</p>
            <div className="bg-surface-elevated rounded-card shadow-warm overflow-hidden">
              {[...sessions]
                .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))
                .slice(0, 10)
                .map((s, i) => {
                  const book = books.find((b) => b.id === s.bookId)
                  const mins = Math.round(s.durationMs / 60_000)
                  const date = new Date(s.startedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                  })
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between px-5 py-3 ${
                        i > 0 ? 'border-t border-border' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {book?.title ?? 'Unknown book'}
                        </p>
                        <p className="text-xs text-ink-ghost">{date}</p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                        <span className="text-xs text-ink-secondary font-mono">
                          {s.wordsRead.toLocaleString()} words
                        </span>
                        <span className="text-xs text-ink-tertiary font-mono w-14 text-right">
                          {mins} min
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-ink-tertiary text-sm">
              No reading sessions yet — start reading to see your stats here.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
