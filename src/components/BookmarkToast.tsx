import { useEffect, useRef, useState } from 'react'
import { Bookmark, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface BookmarkToastProps {
  wordIndex: number
  onConfirm: (note: string) => void
  onDismiss: () => void
}

export function BookmarkToast({ wordIndex, onConfirm, onDismiss }: BookmarkToastProps) {
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function resetTimer() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(onDismiss, 4000)
  }

  useEffect(() => {
    resetTimer()
    setTimeout(() => inputRef.current?.focus(), 80)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()
    if (e.key === 'Enter') { onConfirm(note); return }
    if (e.key === 'Escape') { onDismiss(); return }
    resetTimer()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="flex items-start gap-3 bg-surface-elevated border border-border rounded-2xl shadow-warm-lg px-4 py-3 w-80"
    >
      <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center">
        <Bookmark size={14} className="text-accent" fill="currentColor" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium mb-1.5 text-ink">
          Bookmark at word ~{wordIndex.toLocaleString()}
        </p>
        <input
          ref={inputRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note… (optional)"
          className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-1.5 outline-none focus:border-accent/50 placeholder:text-ink-ghost transition-colors text-ink"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onConfirm(note)}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Check size={11} strokeWidth={2.5} />
            Save
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-ink/8 hover:bg-ink/14 transition-colors text-ink-secondary"
          >
            <X size={11} />
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  )
}
