import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { getAccentColor } from '@/utils/accentColors'
import { useSettingsStore } from '@/stores/settingsStore'

interface ReaderControlsProps {
  isPlaying: boolean
  wpm: number
  currentIndex: number
  totalWords: number
  onTogglePlay: () => void
  onSkipForward: (n: number) => void
  onSkipBackward: (n: number) => void
  onSetWpm: (wpm: number) => void
  onSeek: (index: number) => void
}

export function ReaderControls({
  isPlaying,
  wpm,
  currentIndex,
  totalWords,
  onTogglePlay,
  onSkipForward,
  onSkipBackward,
  onSetWpm,
  onSeek,
}: ReaderControlsProps) {
  const { accentColor } = useSettingsStore()
  const accentHex = getAccentColor(accentColor)
  const [visible, setVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showControls() {
    setVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    // Only auto-hide when playing
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setVisible(false), 3000)
    }
  }

  // Reset hide timer when play state changes
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
        <div className="absolute inset-0 bg-current/10" />
        <div
          className="absolute top-0 left-0 h-full transition-all duration-100"
          style={{ width: `${progress}%`, backgroundColor: accentHex }}
        />
        {/* Hover expand */}
        <div className="absolute inset-0 scale-y-0 group-hover:scale-y-150 bg-current/5 transition-transform origin-top" />
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-center gap-4 bg-cream/85 dark:bg-charcoal/85 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg border border-current/10">

            {/* Skip back */}
            <button
              onClick={() => onSkipBackward(10)}
              className="p-2 rounded-lg hover:bg-current/10 transition-colors opacity-70 hover:opacity-100"
              title="Back 10 words (←)"
            >
              <SkipBack size={18} />
            </button>

            {/* Play / Pause */}
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full text-cream dark:text-charcoal transition-transform active:scale-90 shadow-sm"
              style={{ backgroundColor: accentHex }}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            {/* Skip forward */}
            <button
              onClick={() => onSkipForward(10)}
              className="p-2 rounded-lg hover:bg-current/10 transition-colors opacity-70 hover:opacity-100"
              title="Forward 10 words (→)"
            >
              <SkipForward size={18} />
            </button>

            <div className="flex-1" />

            {/* WPM display */}
            <span className="text-sm font-semibold tabular-nums w-16 text-center opacity-80">
              {wpm} <span className="text-xs font-normal opacity-60">wpm</span>
            </span>

            {/* WPM slider */}
            <input
              type="range"
              min={100}
              max={1000}
              step={25}
              value={wpm}
              onChange={(e) => onSetWpm(Number(e.target.value))}
              className="w-28 accent-current cursor-pointer"
              style={{ accentColor: accentHex }}
              title="Reading speed"
            />
          </div>
        </div>
      </div>
    </>
  )
}
