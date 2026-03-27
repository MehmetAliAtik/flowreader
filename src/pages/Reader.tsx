import { useEffect, useMemo, useRef } from 'react'
import { db, type Book } from '@/db/database'
import { useReaderStore } from '@/stores/readerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useRSVP } from '@/hooks/useRSVP'
import { useKeyboard } from '@/hooks/useKeyboard'
import { WordDisplay } from '@/components/WordDisplay'
import { ReaderControls } from '@/components/ReaderControls'

interface ReaderProps {
  book: Book
  onExit: () => void
}

export function Reader({ book, onExit }: ReaderProps) {
  const { wpm: settingsWpm, chunkSize } = useSettingsStore()
  const { currentIndex, isPlaying, wpm, words } = useReaderStore()
  const { play, pause, togglePlay, skipForward, skipBackward, seekTo, setWpm } = useRSVP()

  // Track session for stats
  const sessionRef = useRef({
    startedAt: new Date(),
    startWordIndex: book.lastWordIndex,
    saved: false,
  })

  // Load book into reader store on mount
  useEffect(() => {
    useReaderStore.getState().load(
      book.id,
      book.words,
      book.lastWordIndex,
      settingsWpm,
      chunkSize,
    )
    sessionRef.current = {
      startedAt: new Date(),
      startWordIndex: book.lastWordIndex,
      saved: false,
    }
  }, [book.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save progress + session on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current.saved) return
      sessionRef.current.saved = true

      const store = useReaderStore.getState()
      const endIndex = store.currentIndex
      const wordsRead = Math.max(0, endIndex - sessionRef.current.startWordIndex)
      const durationMs = Date.now() - sessionRef.current.startedAt.getTime()
      const avgWpm = durationMs > 5000
        ? Math.round((wordsRead / durationMs) * 60_000)
        : store.wpm

      // Fire-and-forget (unmount, no await)
      db.books.update(book.id, {
        lastWordIndex: endIndex,
        lastReadAt: new Date(),
      })

      if (wordsRead > 5 && durationMs > 5000) {
        db.sessions.add({
          bookId: book.id,
          startWordIndex: sessionRef.current.startWordIndex,
          endWordIndex: endIndex,
          wordsRead,
          durationMs,
          avgWpm,
          date: new Date().toISOString().slice(0, 10),
          startedAt: sessionRef.current.startedAt,
          endedAt: new Date(),
        })
      }

      // Upsert auto-resume bookmark
      db.bookmarks
        .where('bookId').equals(book.id)
        .filter((b) => !!b.isAutoResume)
        .delete()
        .then(() => {
          db.bookmarks.add({
            bookId: book.id,
            wordIndex: endIndex,
            isAutoResume: true,
            createdAt: new Date(),
          })
        })
    }
  }, [book.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  const keyHandlers = useMemo(() => ({
    ' ':           () => togglePlay(),
    'ArrowLeft':   () => skipBackward(10),
    'ArrowRight':  () => skipForward(10),
    'ArrowUp':     () => setWpm(useReaderStore.getState().wpm + 25),
    'ArrowDown':   () => setWpm(useReaderStore.getState().wpm - 25),
    'Escape':      () => { pause(); onExit() },
    'b':           () => addBookmark(),
    'f':           () => toggleFullscreen(),
  }), [togglePlay, skipForward, skipBackward, setWpm, pause, onExit]) // eslint-disable-line react-hooks/exhaustive-deps

  useKeyboard(keyHandlers)

  async function addBookmark() {
    const idx = useReaderStore.getState().currentIndex
    await db.bookmarks.add({
      bookId: book.id,
      wordIndex: idx,
      label: `~word ${idx}`,
      isAutoResume: false,
      createdAt: new Date(),
    })
    // TODO Phase 6: show toast with note input
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // Non-sentinel total for progress calculation
  const realTotal = useMemo(
    () => words.filter((w) => w !== '\n\n').length,
    [words],
  )

  return (
    <div className="flex-1 relative overflow-hidden bg-cream dark:bg-charcoal">
      {/* Word display — fills all space */}
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <WordDisplay />
      </div>

      {/* Controls overlay (progress bar + bottom bar) */}
      <ReaderControls
        isPlaying={isPlaying}
        wpm={wpm}
        currentIndex={currentIndex}
        totalWords={realTotal}
        onTogglePlay={togglePlay}
        onSkipForward={skipForward}
        onSkipBackward={skipBackward}
        onSetWpm={setWpm}
        onSeek={seekTo}
      />

      {/* Tap center to play/pause on touch */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={togglePlay}
        style={{ pointerEvents: 'none' }} // let controls handle mouse, keyboard handles keys
      />
    </div>
  )
}
