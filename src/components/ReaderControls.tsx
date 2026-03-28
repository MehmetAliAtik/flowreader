import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Bookmark } from 'lucide-react'

interface ReaderControlsProps {
  isPlaying: boolean
  wpm: number
  currentIndex: number
  totalWords: number
  bookTitle?: string
  onTogglePlay: () => void
  onSkipForward: (n: number) => void
  onSkipBackward: (n: number) => void
  onSetWpm: (wpm: number) => void
  onSeek: (index: number) => void
  onTogglePanel?: () => void
  showPanel?: boolean
}

const WORDS_PER_PAGE = 250

export function ReaderControls({
  isPlaying,
  wpm,
  currentIndex,
  totalWords,
  bookTitle,
  onTogglePlay,
  onSkipForward,
  onSkipBackward,
  onSetWpm,
  onSeek,
  onTogglePanel,
  showPanel,
}: ReaderControlsProps) {
  const [visible, setVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showControls() {
    setVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setVisible(false), 3000)
    }
  }

  useEffect(() => {
    if (!isPlaying) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      setVisible(true)
    } else {
      hideTimerRef.current = setTimeout(() => setVisible(false), 3000)
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [isPlaying])

  useEffect(() => {
    window.addEventListener('mousemove', showControls)
    return () => window.removeEventListener('mousemove', showControls)
  })

  const progress = totalWords > 1 ? (currentIndex / (totalWords - 1)) * 100 : 0
  const currentPage = Math.max(1, Math.ceil(currentIndex / WORDS_PER_PAGE))
  const totalPages  = Math.max(1, Math.ceil(totalWords  / WORDS_PER_PAGE))

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    onSeek(Math.floor(ratio * totalWords))
  }

  return (
    <>
      {/* Progress bar — always visible at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-pointer group z-20"
        onClick={handleProgressClick}
        title={`${Math.round(progress)}%`}
      >
        <div className="absolute inset-0 bg-border/30" />
        <div
          className="absolute top-0 left-0 h-full bg-accent transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 scale-y-0 group-hover:scale-y-150 bg-current/5 transition-transform origin-top" />
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-2xl px-6 py-4">
          {/* Book title + page info */}
          {bookTitle && (
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs text-ink-ghost truncate max-w-xs">{bookTitle}</p>
              <p className="text-xs font-mono text-ink-ghost flex-shrink-0 ml-3">
                p. {currentPage} / {totalPages}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 bg-surface/88 backdrop-blur-md rounded-2xl px-5 py-3 shadow-warm border border-border/60">

            {/* Skip back */}
            <button
              onClick={() => onSkipBackward(10)}
              className="p-2 rounded-lg hover:bg-ink/10 transition-colors text-ink-secondary hover:text-ink"
              title="Back 10 words (←)"
            >
              <SkipBack size={18} />
            </button>

            {/* Play / Pause */}
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white transition-transform active:scale-90 shadow-warm-sm hover:opacity-90"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            {/* Skip forward */}
            <button
              onClick={() => onSkipForward(10)}
              className="p-2 rounded-lg hover:bg-ink/10 transition-colors text-ink-secondary hover:text-ink"
              title="Forward 10 words (→)"
            >
              <SkipForward size={18} />
            </button>

            {/* Bookmark panel toggle */}
            {onTogglePanel && (
              <button
                onClick={onTogglePanel}
                className={`p-2 rounded-lg transition-colors ${
                  showPanel ? 'bg-accent-soft text-accent' : 'text-ink-secondary hover:text-ink hover:bg-ink/10'
                }`}
                title="Bookmarks (Ctrl+B)"
              >
                <Bookmark size={16} />
              </button>
            )}

            <div className="flex-1" />

            {/* WPM display */}
            <span className="text-sm font-mono font-semibold tabular-nums w-16 text-center text-ink-secondary">
              {wpm} <span className="text-xs font-normal text-ink-tertiary">wpm</span>
            </span>

            {/* WPM slider */}
            <input
              type="range"
              min={100}
              max={1000}
              step={25}
              value={wpm}
              onChange={(e) => onSetWpm(Number(e.target.value))}
              className="w-28 cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
              title="Reading speed"
            />
          </div>
        </div>
      </div>
    </>
  )
}
