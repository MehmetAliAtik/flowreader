import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Trash2, X } from 'lucide-react'
import { db, type Bookmark as BookmarkType } from '@/db/database'

interface BookmarkPanelProps {
  bookId: number
  totalWords: number
  onJump: (wordIndex: number) => void
  onClose: () => void
}

export function BookmarkPanel({ bookId, totalWords, onJump, onClose }: BookmarkPanelProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNote, setEditNote] = useState('')

  async function loadBookmarks() {
    const bms = await db.bookmarks
      .where('bookId').equals(bookId)
      .filter((b) => !b.isAutoResume)
      .sortBy('wordIndex')
    setBookmarks(bms)
  }

  useEffect(() => {
    loadBookmarks()
  }, [bookId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: number) {
    await db.bookmarks.delete(id)
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }

  function startEdit(bm: BookmarkType) {
    setEditingId(bm.id)
    setEditNote(bm.note ?? '')
  }

  async function saveEdit(id: number) {
    await db.bookmarks.update(id, { note: editNote })
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, note: editNote } : b)))
    setEditingId(null)
  }

  function formatPosition(index: number) {
    const pct = totalWords > 0 ? Math.round((index / totalWords) * 100) : 0
    return `~word ${index.toLocaleString()} · ${pct}%`
  }

  function timeAgo(date: Date) {
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (secs < 60) return 'just now'
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
    return `${Math.floor(secs / 86400)}d ago`
  }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="absolute right-0 top-0 bottom-0 w-72 z-30 flex flex-col bg-surface border-l border-border shadow-warm-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bookmark size={15} className="text-accent" />
          <span className="text-sm font-semibold text-ink">Bookmarks</span>
          {bookmarks.length > 0 && (
            <span className="text-xs text-ink-tertiary">({bookmarks.length})</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-ink/8 transition-colors text-ink-tertiary hover:text-ink"
        >
          <X size={15} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-ink-tertiary px-6 text-center">
            <Bookmark size={28} className="mb-2 opacity-40" />
            <p className="text-sm">No bookmarks yet</p>
            <p className="text-xs mt-1 opacity-70">Press B while reading to add one</p>
          </div>
        ) : (
          <div className="px-3 space-y-1">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="group rounded-xl border border-border/40 hover:border-border bg-surface-secondary hover:bg-surface-elevated transition-all duration-150 p-3"
              >
                <button
                  onClick={() => onJump(Math.max(0, bm.wordIndex - 15))}
                  className="w-full text-left"
                >
                  <p className="text-xs font-semibold mb-0.5 text-accent">
                    {bm.label ?? formatPosition(bm.wordIndex)}
                  </p>
                  <p className="text-[10px] text-ink-tertiary">{timeAgo(bm.createdAt)}</p>
                </button>

                {editingId === bm.id ? (
                  <div className="mt-2">
                    <input
                      autoFocus
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === 'Enter') saveEdit(bm.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="w-full text-xs bg-surface border border-border rounded-lg px-2 py-1 outline-none focus:border-accent/50 text-ink placeholder:text-ink-ghost"
                    />
                    <div className="flex gap-1.5 mt-1.5">
                      <button
                        onClick={() => saveEdit(bm.id)}
                        className="text-xs px-2 py-0.5 rounded-md bg-accent text-white font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs px-2 py-0.5 rounded-md bg-ink/10 hover:bg-ink/15 text-ink"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  bm.note && (
                    <p
                      className="text-xs text-ink-secondary mt-1.5 cursor-pointer hover:text-ink transition-colors line-clamp-2"
                      onClick={() => startEdit(bm)}
                    >
                      {bm.note}
                    </p>
                  )
                )}

                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!editingId && (
                    <button
                      onClick={() => startEdit(bm)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-ink/8 hover:bg-ink/14 transition-colors text-ink-secondary"
                    >
                      {bm.note ? 'Edit note' : 'Add note'}
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    onClick={() => handleDelete(bm.id)}
                    className="p-1 rounded-md hover:bg-danger/15 text-ink-tertiary hover:text-danger transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-border flex-shrink-0">
        <p className="text-[10px] text-ink-ghost text-center">
          Click a bookmark to jump · Ctrl+B to close
        </p>
      </div>
    </motion.div>
  )
}
