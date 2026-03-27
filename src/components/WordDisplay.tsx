import { useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReaderStore } from '@/stores/readerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getBionicSplit } from '@/utils/bionicSplit'
import { getAccentColor } from '@/utils/accentColors'

const FONT_FAMILY_MAP: Record<string, string> = {
  literata:     '"Literata", Georgia, serif',
  atkinson:     '"Atkinson Hyperlegible", sans-serif',
  merriweather: '"Merriweather", Georgia, serif',
  'ibm-plex':   '"IBM Plex Sans", sans-serif',
  outfit:       '"Outfit", sans-serif',
}

function getOrpIndex(word: string): number {
  return Math.max(0, Math.floor((word.length - 1) / 2))
}

/** Collect up to `count` non-sentinel words walking in `dir` from `start` (exclusive) */
function getContextWords(words: string[], start: number, count: number, dir: 1 | -1): string[] {
  const result: string[] = []
  let i = start + dir
  while (i >= 0 && i < words.length && result.length < count) {
    if (words[i] !== '\n\n') result.push(words[i])
    i += dir
  }
  return dir === -1 ? result.reverse() : result
}

export function WordDisplay() {
  const { words, currentIndex, chunkSize } = useReaderStore()
  const { fontSize, fontFamily, bionicReading, showContext, accentColor } = useSettingsStore()

  const accentHex = getAccentColor(accentColor)
  const fontFamilyCSS = FONT_FAMILY_MAP[fontFamily] ?? FONT_FAMILY_MAP.literata

  // Build the display word(s) — filter sentinels from the chunk
  const chunkWords = words
    .slice(currentIndex, currentIndex + chunkSize)
    .filter((w) => w !== '\n\n')
  const displayWord = chunkWords[0] ?? ''

  const orpIdx = getOrpIndex(displayWord)
  const prevWords = showContext ? getContextWords(words, currentIndex, 5, -1) : []
  const nextWords = showContext ? getContextWords(words, currentIndex + chunkSize - 1, 3, 1) : []

  // Measure ORP letter position for focus guide
  const orpRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [guideLeft, setGuideLeft] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!orpRef.current || !containerRef.current) return
    const orpRect = orpRef.current.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()
    setGuideLeft(orpRect.left + orpRect.width / 2 - containerRect.left)
  }, [displayWord, fontSize, fontFamily])

  // Render a word with ORP + optional bionic
  function renderWord(word: string, isMain: boolean) {
    if (!word) return null

    if (isMain) {
      const before = word.slice(0, orpIdx)
      const orpChar = word[orpIdx] ?? ''
      const after = word.slice(orpIdx + 1)

      if (bionicReading) {
        const { bold, rest } = getBionicSplit(word)
        // Merge bionic bold with ORP coloring
        const boldOrpIdx = orpIdx < bold.length ? orpIdx : -1

        return (
          <>
            {boldOrpIdx >= 0 ? (
              // ORP is in the bold portion
              <span style={{ fontWeight: 800 }}>
                {bold.slice(0, boldOrpIdx)}
                <span ref={orpRef} style={{ color: accentHex }}>{bold[boldOrpIdx]}</span>
                {bold.slice(boldOrpIdx + 1)}
              </span>
            ) : (
              <>
                <span style={{ fontWeight: 800 }}>{bold}</span>
                {/* ORP is in the rest portion */}
                <span style={{ fontWeight: 300 }}>
                  {rest.slice(0, orpIdx - bold.length)}
                  <span ref={orpRef} style={{ color: accentHex }}>{rest[orpIdx - bold.length]}</span>
                  {rest.slice(orpIdx - bold.length + 1)}
                </span>
              </>
            )}
          </>
        )
      }

      // Normal ORP rendering
      return (
        <>
          {before}
          <span ref={orpRef} style={{ color: accentHex }}>{orpChar}</span>
          {after}
        </>
      )
    }

    // Context word — bionic if enabled, no ORP
    if (bionicReading) {
      const { bold, rest } = getBionicSplit(word)
      return <><span style={{ fontWeight: 700 }}>{bold}</span>{rest}</>
    }
    return word
  }

  const contextFontSize = Math.round(fontSize * 0.38)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center select-none"
    >
      {/* Focus guide line */}
      {guideLeft !== null && (
        <div
          className="absolute top-0 bottom-0 w-px pointer-events-none z-0"
          style={{ left: guideLeft, backgroundColor: accentHex, opacity: 0.18 }}
        />
      )}

      {/* Context above */}
      {showContext && prevWords.length > 0 && (
        <div
          className="mb-4 text-center leading-relaxed z-10"
          style={{
            fontSize: contextFontSize,
            fontFamily: fontFamilyCSS,
            opacity: 0.2,
          }}
        >
          {prevWords.map((w, i) => (
            <span key={i}>{i > 0 ? ' ' : ''}{renderWord(w, false)}</span>
          ))}
        </div>
      )}

      {/* Main word */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0.5, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: Math.min(0.1, (60_000 / (useReaderStore.getState().wpm || 300) / 1000) * 0.4), ease: 'easeOut' }}
          className="z-10 text-center leading-none"
          style={{ fontSize, fontFamily: fontFamilyCSS }}
        >
          {chunkWords.length <= 1 ? (
            renderWord(displayWord, true)
          ) : (
            // Multi-word chunk: ORP on first word, rest plain
            chunkWords.map((w, i) => (
              <span key={i}>{i > 0 ? ' ' : ''}{renderWord(w, i === 0)}</span>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Context below */}
      {showContext && nextWords.length > 0 && (
        <div
          className="mt-4 text-center leading-relaxed z-10"
          style={{
            fontSize: contextFontSize,
            fontFamily: fontFamilyCSS,
            opacity: 0.15,
          }}
        >
          {nextWords.map((w, i) => (
            <span key={i}>{i > 0 ? ' ' : ''}{renderWord(w, false)}</span>
          ))}
        </div>
      )}
    </div>
  )
}
