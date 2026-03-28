import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { db, type Book } from '@/db/database'
import { useReaderStore } from '@/stores/readerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useRSVP } from '@/hooks/useRSVP'
import { useKeyboard } from '@/hooks/useKeyboard'
import { WordDisplay } from '@/components/WordDisplay'
import { ReaderControls } from '@/components/ReaderControls'
import { BookmarkToast } from '@/components/BookmarkToast'
import { BookmarkPanel } from '@/components/BookmarkPanel'

interface ReaderProps {
  book: Book
  onExit: () => void
}

interface PendingBookmark {
  wordIndex: number
}

export function Reader({ book, onExit }: ReaderProps) {
  const { wpm: settingsWpm, chunkSize } = useSettingsStore()
  const { currentIndex, isPlaying, wpm, words } = useReaderStore()
  const { play, pause, togglePlay, skipForward, skipBackward, seekTo, setWpm } = useRSVP()

  const [showPanel, setShowPanel] = useState(false)
  const [pendingBookmark, setPendingBookmark] = useState<PendingBookmark | null>(null)

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

  // --- Bookmark actions ---
  function triggerAddBookmark() {
    const idx = useReaderStore.getState().currentIndex
    // Pause reading while toast is visible so user can type comfortably
    if (useReaderStore.getState().isPlaying) pause()
    setPendingBookmark({ wordIndex: idx })
  }

  async function confirmBookmark(note: string) {
    if (!pendingBookmark) return
    const idx = pendingBookmark.wordIndex
    await db.bookmarks.add({
      bookId: book.id,
      wordIndex: idx,
      label: `~word ${idx.toLocaleString()}`,
      note: note.trim() || undefined,
      isAutoResume: false,
      createdAt: new Date(),
    })
    setPendingBookmark(null)
  }

  function dismissBookmark() {
    setPendingBookmark(null)
  }

  function handleJumpToBookmark(wordIndex: number) {
    seekTo(wordIndex)
    setShowPanel(false)
  }

  function togglePanel() {
    setShowPanel((v) => !v)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // --- Keyboard shortcuts ---
  const keyHandlers = useMemo(() => ({
    ' ':        () => togglePlay(),
    'ArrowLeft':  () => skipBackward(10),
    'ArrowRight': () => skipForward(10),
    'ArrowUp':    () => setWpm(useReaderStore.getState().wpm + 25),
    'ArrowDown':  () => setWpm(useReaderStore.getState().wpm - 25),
    'Escape':     () => { pause(); onExit() },
    'b':          () => triggerAddBookmark(),
    'f':          () => toggleFullscreen(),
  }), [togglePlay, skipForward, skipBackward, setWpm, pause, onExit]) // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl+B wired separately (modifier key)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        togglePanel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Disable regular shortcuts while bookmark toast is visible
  useKeyboard(keyHandlers, pendingBookmark !== null)

  // Non-sentinel total for progress calculation
  const realTotal = useMemo(
    () => words.filter((w) => w !== '\n\n').length,
    [words],
  )

  return (
    <div className="flex-1 relative overflow-hidden reader-bg">
      {/* Word display */}
      <div
        className="absolute inset-0 flex items-center justify-center px-8"
        style={{ paddingRight: showPanel ? '18rem' : undefined }}
      >
        <WordDisplay />
      </div>

      {/* Controls overlay */}
      <ReaderControls
        isPlaying={isPlaying}
        wpm={wpm}
        currentIndex={currentIndex}
        totalWords={realTotal}
        bookTitle={book.title}
        onTogglePlay={togglePlay}
        onSkipForward={skipForward}
        onSkipBackward={skipBackward}
        onSetWpm={setWpm}
        onSeek={seekTo}
        onTogglePanel={togglePanel}
        showPanel={showPanel}
      />

      {/* Bookmark panel */}
      <AnimatePresence>
        {showPanel && (
          <BookmarkPanel
            bookId={book.id}
            totalWords={realTotal}
            onJump={handleJumpToBookmark}
            onClose={() => setShowPanel(false)}
          />
        )}
      </AnimatePresence>

      {/* Bookmark toast (bottom-right) */}
      <div className="absolute bottom-24 right-6 z-40 pointer-events-none">
        <AnimatePresence>
          {pendingBookmark && (
            <div className="pointer-events-auto">
              <BookmarkToast
                wordIndex={pendingBookmark.wordIndex}
                onConfirm={confirmBookmark}
                onDismiss={dismissBookmark}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
