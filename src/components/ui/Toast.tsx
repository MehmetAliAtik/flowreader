import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useToastStore } from '@/stores/toastStore'

const ICONS = {
  success: <CheckCircle size={16} className="text-success flex-shrink-0" />,
  error:   <AlertCircle size={16} className="text-danger flex-shrink-0" />,
  info:    <Info        size={16} className="text-accent flex-shrink-0" />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="pointer-events-auto flex items-center gap-3 bg-surface-elevated border border-border rounded-xl shadow-warm-lg px-4 py-3 min-w-[240px] max-w-xs"
          >
            {ICONS[t.type]}
            <span className="flex-1 text-sm text-ink">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-ink-tertiary hover:text-ink transition-colors ml-1"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
