import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search, SortAsc, Upload, Bookmark } from 'lucide-react'
import { db, type Book, type Bookmark as BookmarkType } from '@/db/database'
import { BookCard } from '@/components/BookCard'
import { useImportBook } from '@/hooks/useImportBook'

type SortKey = 'dateAdded' | 'lastReadAt' | 'title' | 'progress'

interface LibraryProps {
  onOpenBook: (book: Book) => void
}

export function Library({ onOpenBook }: LibraryProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [bookmarkCounts, setBookmarkCounts] = useState<Record<number, number>>({})
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('dateAdded')
  const [isDragging, setIsDragging] = useState(false)
  const [showContinueModal, setShowContinueModal] = useState(false)
  const [pendingBook, setPendingBook] = useState<Book | null>(null)
  const [pendingBookmarks, setPendingBookmarks] = useState<BookmarkType[]>([])
  const [showBookmarkPicker, setShowBookmarkPicker] = useState(false)
  const dragCounter = useRef(0)

  const refresh = useCallback(async () => {
    const all = await db.books.toArray()
    setBooks(all)

    // Load bookmark counts per book (exclude auto-resume entries)
    const counts: Record<number, number> = {}
    for (const book of all) {
      counts[book.id] = await db.bookmarks
        .where('bookId')
        .equals(book.id)
        .filter((b) => !b.isAutoResume)
        .count()
    }
    setBookmarkCounts(counts)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const { importFromDialog, importFromPath, isLoading, error } = useImportBook(refresh)

  // Sorted + filtered books
  const displayed = useMemo(() => {
    let list = books.filter((b) =>
      b.title.toLowerCase().includes(search.toLowerCase()),
    )
    switch (sortKey) {
      case 'dateAdded':
        list = [...list].sort((a, b) => +new Date(b.dateAdded) - +new Date(a.dateAdded))
        break
      case 'lastReadAt':
        list = [...list].sort((a, b) => {
          if (!a.lastReadAt) return 1
          if (!b.lastReadAt) return -1
          return +new Date(b.lastReadAt) - +new Date(a.lastReadAt)
        })
        break
      case 'title':
        list = [...list].sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'progress':
        list = [...list].sort((a, b) => {
          const pa = b.totalWords ? b.lastWordIndex / b.totalWords : 0
          const pb = a.totalWords ? a.lastWordIndex / a.totalWords : 0
          return pa - pb
        })
        break
    }
    return list
  }, [books, search, sortKey])

  // --- Drag & Drop ---
  function onDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.name.toLowerCase().endsWith('.pdf'),
    )
    for (const file of files) {
      // In Electron, File.path gives the real filesystem path
      const path = (file as File & { path?: string }).path
      if (path) await importFromPath(path, file.name)
    }
  }

  // --- Open book flow ---
  async function handleOpenBook(book: Book) {
    if (book.lastWordIndex > 0) {
      const bms = await db.bookmarks
        .where('bookId').equals(book.id)
        .filter((b) => !b.isAutoResume)
        .sortBy('wordIndex')
      setPendingBookmarks(bms)
      setPendingBook(book)
      setShowContinueModal(true)
      setShowBookmarkPicker(false)
    } else {
      onOpenBook(book)
    }
  }

  function continueReading() {
    if (pendingBook) onOpenBook(pendingBook)
    setShowContinueModal(false)
    setPendingBook(null)
  }

  async function startFromBeginning() {
    if (!pendingBook) return
    await db.books.update(pendingBook.id, { lastWordIndex: 0 })
    const fresh = await db.books.get(pendingBook.id)
    if (fresh) onOpenBook(fresh)
    setShowContinueModal(false)
    setPendingBook(null)
  }

  async function jumpToBookmark(wordIndex: number) {
    if (!pendingBook) return
    await db.books.update(pendingBook.id, { lastWordIndex: wordIndex })
    const fresh = await db.books.get(pendingBook.id)
    if (fresh) onOpenBook(fresh)
    setShowContinueModal(false)
    setPendingBook(null)
  }

  const progress = pendingBook && pendingBook.totalWords > 0
    ? Math.round((pendingBook.lastWordIndex / pendingBook.totalWords) * 100)
    : 0

  return (
    <div
      className="flex-1 flex flex-col relative"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-surface/90 border-2 border-dashed border-accent/40 rounded-xl m-4 pointer-events-none backdrop-blur-sm">
          <Upload size={48} className="mb-3 text-accent opacity-70" />
          <p className="text-lg font-medium text-ink opacity-80">Drop PDFs to import</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-8 py-4 border-b border-current/8 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books…"
            className="w-full pl-9 pr-3 py-2 rounded-full bg-surface-secondary border border-transparent text-sm text-ink outline-none focus:border-border placeholder:text-ink-ghost transition-colors"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-surface-secondary hover:bg-surface-elevated transition-colors">
          <SortAsc size={14} className="text-ink-tertiary flex-shrink-0" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-sm bg-transparent outline-none cursor-pointer text-ink"
          >
            <option value="dateAdded">Date added</option>
            <option value="lastReadAt">Last read</option>
            <option value="title">Title</option>
            <option value="progress">Progress</option>
          </select>
        </div>

        <div className="flex-1" />

        {/* Add book button */}
        <button
          onClick={importFromDialog}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-white text-sm font-medium shadow-warm-sm disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus size={15} strokeWidth={2.5} />
          {isLoading ? 'Processing…' : 'Add Book'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-8 mb-4 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm border border-danger/20">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4">
        {books.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-72 rounded-2xl border-2 border-dashed border-border cursor-pointer hover:border-accent/40 transition-colors group"
            onClick={importFromDialog}
          >
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mb-4 text-ink-tertiary group-hover:text-accent transition-colors">
              <rect x="6" y="4" width="36" height="44" rx="3" stroke="currentColor" strokeWidth="2" />
              <line x1="14" y1="16" x2="34" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="14" y1="23" x2="34" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="14" y1="30" x2="26" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="42" cy="42" r="11" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
              <line x1="42" y1="37" x2="42" y2="47" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="37" y1="42" x2="47" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-base font-medium text-ink-secondary">Drop a PDF here or click to import</p>
            <p className="text-sm text-ink-ghost mt-1">Your library is empty</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-ink-tertiary">
            <p className="text-base">No books match "{search}"</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
            {displayed.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                bookmarkCount={bookmarkCounts[book.id] ?? 0}
                onOpen={handleOpenBook}
                onRefresh={refresh}
              />
            ))}
            {/* Add book card */}
            <div
              onClick={importFromDialog}
              className="flex flex-col items-center justify-center aspect-[2/3] rounded-card border-2 border-dashed border-border cursor-pointer hover:border-accent/50 hover:bg-accent-soft transition-all group"
            >
              <Plus size={24} className="text-ink-tertiary group-hover:text-accent transition-colors mb-2" strokeWidth={1.5} />
              <span className="text-xs text-ink-tertiary group-hover:text-accent transition-colors">Add Book</span>
            </div>
          </div>
        )}
      </div>

      {/* Continue reading modal */}
      {showContinueModal && pendingBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowContinueModal(false)}
        >
          <div
            className="bg-surface-elevated rounded-modal shadow-warm-lg p-6 max-w-sm w-full mx-4 paper-texture"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-serif font-semibold mb-1 text-ink">Continue reading?</h3>
            <p className="text-sm text-ink-secondary mb-5">
              <span className="font-medium text-ink">{pendingBook.title}</span>
              {' '}— {progress}% read
            </p>

            {!showBookmarkPicker ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={continueReading}
                  className="w-full py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Continue from {progress}%
                </button>
                {pendingBookmarks.length > 0 && (
                  <button
                    onClick={() => setShowBookmarkPicker(true)}
                    className="w-full py-2.5 rounded-full bg-ink/8 text-ink text-sm hover:bg-ink/14 transition-colors flex items-center justify-center gap-2"
                  >
                    <Bookmark size={13} />
                    Pick a bookmark ({pendingBookmarks.length})
                  </button>
                )}
                <button
                  onClick={startFromBeginning}
                  className="w-full py-2.5 rounded-full bg-ink/8 text-ink text-sm hover:bg-ink/14 transition-colors"
                >
                  Start from beginning
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setShowBookmarkPicker(false)}
                  className="text-xs opacity-50 hover:opacity-80 mb-3 flex items-center gap-1 transition-opacity"
                >
                  ← Back
                </button>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {pendingBookmarks.map((bm) => {
                    const pct = pendingBook.totalWords > 0
                      ? Math.round((bm.wordIndex / pendingBook.totalWords) * 100)
                      : 0
                    return (
                      <button
                        key={bm.id}
                        onClick={() => jumpToBookmark(bm.wordIndex)}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-ink/6 hover:bg-ink/12 transition-colors text-ink"
                      >
                        <p className="text-sm font-medium">{bm.label ?? `~word ${bm.wordIndex}`}</p>
                        {bm.note && <p className="text-xs opacity-50 mt-0.5 truncate">{bm.note}</p>}
                        <p className="text-xs opacity-40 mt-0.5">{pct}% through</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
