import type { ReadingSession } from '@/db/database'

export interface DayData {
  date: string      // YYYY-MM-DD
  label: string     // Mon, Tue, …
  minutes: number
  metGoal: boolean
  isToday: boolean
}

function toDate(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10)
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

/** Last 7 calendar days including today */
export function getWeekData(sessions: ReadingSession[], dailyGoalMinutes: number): DayData[] {
  const today = toDate(new Date())
  const days: DayData[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = toDate(d)
    const minutes = sessions
      .filter((s) => s.date === dateStr)
      .reduce((sum, s) => sum + s.durationMs / 60_000, 0)

    days.push({
      date: dateStr,
      label: dayLabel(dateStr),
      minutes: Math.round(minutes),
      metGoal: minutes >= dailyGoalMinutes,
      isToday: dateStr === today,
    })
  }
  return days
}

/** Minutes read today */
export function getTodayMinutes(sessions: ReadingSession[]): number {
  const today = toDate(new Date())
  return Math.round(
    sessions
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.durationMs / 60_000, 0),
  )
}

/** Count consecutive days (from today backwards) where goal was met */
export function getCurrentStreak(sessions: ReadingSession[], dailyGoalMinutes: number): number {
  const today = toDate(new Date())
  let streak = 0
  let d = new Date()

  for (let i = 0; i < 365; i++) {
    const dateStr = toDate(d)
    const minutes = sessions
      .filter((s) => s.date === dateStr)
      .reduce((sum, s) => sum + s.durationMs / 60_000, 0)

    if (minutes >= dailyGoalMinutes) {
      streak++
      d.setDate(d.getDate() - 1)
    } else if (dateStr === today) {
      // Today hasn't met goal yet — don't break streak, just don't count
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}
