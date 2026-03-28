import { useEffect, useRef, useState } from 'react'
import { Bookmark, MoreVertical, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { db, type Book } from '@/db/database'
import { formatRelativeTime } from '@/utils/formatTime'
import { useToastStore } from '@/stores/toastStore'

interface BookCardProps {
  book: Book
  bookmarkCount: number
  onOpen: (book: Book) => void
  onRefresh: () => void
}

export function BookCard({ book, bookmarkCount, onOpen, onRefresh }: BookCardProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(book.title)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!book.thumbnail) return
    const url = URL.createObjectURL(book.thumbnail)
    setThumbUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [book.thumbnail])

  useEffect(() => {
    if (isRenaming) renameRef.current?.select()
  }, [isRenaming])

  useEffect(() => {
    if (!menuPos) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuPos(null)
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuPos(null) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [menuPos])

  const progress = book.totalWords > 0 ? Math.round((book.lastWordIndex / book.totalWords) * 100) : 0

  async function handleRename() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== book.title) {
      await db.books.update(book.id, { title: trimmed })
      onRefresh()
    }
    setIsRenaming(false)
  }

  async function handleDelete() {
    setMenuPos(null)
    await db.bookmarks.where('bookId').equals(book.id).delete()
    await db.sessions.where('bookId').equals(book.id).delete()
    await db.books.delete(book.id)
    useToastStore.getState().addToast(`"${book.title}" deleted`, 'info')
    onRefresh()
  }

  async function handleResetProgress() {
    setMenuPos(null)
    await db.books.update(book.id, { lastWordIndex: 0 })
    useToastStore.getState().addToast('Progress reset', 'info')
    onRefresh()
  }

  function openMenu(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setMenuPos({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        className="group relative flex flex-col gap-2 p-3 rounded-card bg-surface-elevated border border-border/40 hover:border-border hover:shadow-warm cursor-pointer transition-all duration-150 hover:-translate-y-0.5 paper-texture"
        onClick={() => !isRenaming && onOpen(book)}
        onContextMenu={openMenu}
      >
        {/* Thumbnail */}
        <div className="w-full aspect-[2/3] rounded-md overflow-hidden bg-ink/5 flex items-center justify-center flex-shrink-0 relative">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-20">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="2" width="24" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <line x1="9" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="9" y1="15" x2="23" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="9" y1="20" x2="18" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}

          {bookmarkCount > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-ink/75 text-surface text-xs px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              <Bookmark size={9} />
              <span>{bookmarkCount}</span>
            </div>
          )}

          <button
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-ink/60 text-surface"
            onClick={openMenu}
          >
            <MoreVertical size={13} />
          </button>
        </div>

        {/* Title */}
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') { setRenameValue(book.title); setIsRenaming(false) }
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium w-full bg-transparent border-b border-border outline-none pb-0.5"
          />
        ) : (
          <p
            className="text-sm font-medium leading-tight line-clamp-2 text-ink"
            onDoubleClick={(e) => {
              e.stopPropagation()
              setRenameValue(book.title)
              setIsRenaming(true)
            }}
          >
            {book.title}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-ink-tertiary">
          <span>{book.totalWords.toLocaleString()} words</span>
          <span>{formatRelativeTime(book.lastReadAt)}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-border/50">
          <div
            className="h-1 rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {progress > 0 && (
          <p className="text-xs text-ink-tertiary text-right -mt-1 font-mono">{progress}%</p>
        )}
      </div>

      {/* Context menu */}
      {menuPos && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-surface-elevated border border-border rounded-modal shadow-warm-lg p-1 min-w-[170px]"
          style={{ top: menuPos.y, left: menuPos.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-ink/8 transition-colors text-left rounded-lg text-ink"
            onClick={() => { setMenuPos(null); setRenameValue(book.title); setIsRenaming(true) }}
          >
            <Pencil size={14} className="opacity-50 flex-shrink-0" />
            Rename
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-ink/8 transition-colors text-left rounded-lg text-ink"
            onClick={handleResetProgress}
          >
            <RotateCcw size={14} className="opacity-50 flex-shrink-0" />
            Reset progress
          </button>
          <div className="my-1 border-t border-border/50" />
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors text-left rounded-lg"
            onClick={handleDelete}
          >
            <Trash2 size={14} className="flex-shrink-0" />
            Delete
          </button>
        </div>
      )}
    </>
  )
}
