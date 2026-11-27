import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Moon, Sun, Monitor } from 'lucide-react'
import {
  useSettingsStore,
  type AccentColor,
  type FontFamily,
  type ThemeMode,
} from '@/stores/settingsStore'
import { ACCENT_LIGHT, ACCENT_LABELS } from '@/utils/accentColors'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

const FONTS: { value: FontFamily; label: string; family: string }[] = [
  { value: 'literata',     label: 'Literata',              family: '"Literata", Georgia, serif' },
  { value: 'atkinson',     label: 'Atkinson Hyperlegible', family: '"Atkinson Hyperlegible", sans-serif' },
  { value: 'merriweather', label: 'Merriweather',          family: '"Merriweather", Georgia, serif' },
  { value: 'ibm-plex',     label: 'IBM Plex Sans',         family: '"IBM Plex Sans", sans-serif' },
  { value: 'outfit',       label: 'Outfit',                family: '"Outfit", sans-serif' },
]

const ACCENTS: AccentColor[] = ['goldenrod', 'amber', 'sage', 'clay', 'plum']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h3 className="label-caps mb-4">{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="text-xs text-ink-tertiary mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
        checked ? 'bg-accent' : 'bg-ink/20'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const {
    theme, setTheme,
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    wpm, setWpm,
    chunkSize, setChunkSize,
    smartPause, setSmartPause,
    bionicReading, setBionicReading,
    showContext, setShowContext,
    accentColor, setAccentColor,
    dailyGoal, setDailyGoal,
  } = useSettingsStore()

  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  const wpmLabel = `${wpm} wpm ≈ ${(wpm / 60).toFixed(1)} words/sec`

  const themeButtons: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { value: 'light',  icon: <Sun size={14} />,     label: 'Light' },
    { value: 'dark',   icon: <Moon size={14} />,    label: 'Dark' },
    { value: 'system', icon: <Monitor size={14} />, label: 'System' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="bg-surface-elevated rounded-modal shadow-warm-lg w-full max-w-md max-h-[85vh] flex flex-col paper-texture"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="text-base font-serif font-semibold text-ink">Settings</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-ink/8 transition-colors text-ink-tertiary hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* ── Reading ── */}
              <Section title="Reading">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-ink">Reading speed</p>
                    <p className="text-xs text-ink-tertiary font-mono tabular-nums">{wpmLabel}</p>
                  </div>
                  <input
                    type="range" min={100} max={1000} step={25} value={wpm}
                    onChange={(e) => setWpm(Number(e.target.value))}
                    className="w-full cursor-pointer"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between text-[10px] text-ink-ghost mt-1">
                    <span>100</span><span>1000 wpm</span>
                  </div>
                </div>

                <Row label="Words per flash" hint="How many words shown at once">
                  <div className="flex gap-1.5">
                    {([1, 2, 3] as const).map((n) => (
                      <button
                        key={n}
                        onClick={() => setChunkSize(n)}
                        className={`w-9 h-8 rounded-lg text-sm font-semibold transition-all ${
                          chunkSize === n
                            ? 'bg-accent text-white shadow-warm-sm'
                            : 'bg-ink/8 text-ink-secondary hover:bg-ink/15'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </Row>

                <Row label="Smart pausing" hint="Longer pauses on punctuation & long words">
                  <Toggle checked={smartPause} onChange={setSmartPause} />
                </Row>

                <Row label="Bold prefix" hint="Bold the first portion of each word">
                  <Toggle checked={bionicReading} onChange={setBionicReading} />
                </Row>
              </Section>

              {/* ── Display ── */}
              <Section title="Display">
                <div>
                  <p className="text-sm font-medium text-ink mb-3">Font</p>
                  <div className="space-y-2">
                    {FONTS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFontFamily(f.value)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                          fontFamily === f.value
                            ? 'border-accent/50 bg-accent-soft'
                            : 'border-border hover:border-border/80 hover:bg-ink/4'
                        }`}
                      >
                        <span className="text-sm text-ink" style={{ fontFamily: f.family }}>
                          {f.label}
                        </span>
                        <span className="text-xs text-ink-tertiary ml-3 flex-1 text-right" style={{ fontFamily: f.family }}>
                          The quick brown fox
                        </span>
                        {fontFamily === f.value && (
                          <span className="w-2 h-2 rounded-full ml-3 flex-shrink-0 bg-accent" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-ink">Font size</p>
                    <p className="text-xs text-ink-tertiary font-mono tabular-nums">{fontSize}px</p>
                  </div>
                  <input
                    type="range" min={24} max={96} step={2} value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full cursor-pointer"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between text-[10px] text-ink-ghost mt-1">
                    <span>24px</span><span>96px</span>
                  </div>
                </div>

                <Row label="Context words" hint="Show previous & next words for context">
                  <Toggle checked={showContext} onChange={setShowContext} />
                </Row>
              </Section>

              {/* ── Appearance ── */}
              <Section title="Appearance">
                <Row label="Theme">
                  <div className="flex gap-1.5">
                    {themeButtons.map(({ value, icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        title={label}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          theme === value
                            ? 'bg-ink/15 text-ink'
                            : 'text-ink-tertiary hover:text-ink hover:bg-ink/8'
                        }`}
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </div>
                </Row>

                <Row label="Accent color">
                  <div className="flex gap-2">
                    {ACCENTS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        title={ACCENT_LABELS[color]}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110 relative"
                        style={{ backgroundColor: ACCENT_LIGHT[color] }}
                      >
                        {accentColor === color && (
                          <span className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-current/50" />
                        )}
                      </button>
                    ))}
                  </div>
                </Row>
              </Section>

              {/* ── Goals ── */}
              <Section title="Goals">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-ink">Daily reading goal</p>
                    <p className="text-xs text-ink-tertiary font-mono tabular-nums">{dailyGoal} min</p>
                  </div>
                  <input
                    type="range" min={5} max={60} step={5} value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                    className="w-full cursor-pointer"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between text-[10px] text-ink-ghost mt-1">
                    <span>5 min</span><span>60 min</span>
                  </div>
                </div>
              </Section>

              <div className="mt-2 pt-5 border-t border-border/50 text-center">
                <p className="text-xs text-ink-ghost">
                  FlowReader — all data stored locally, nothing sent anywhere.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
