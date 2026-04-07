import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReaderStore } from '@/stores/readerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getBionicSplit } from '@/utils/bionicSplit'
import { measureOrpOffset, measureOrpOffsetBionic } from '@/utils/textMeasure'

const FONT_FAMILY_MAP: Record<string, string> = {
  literata:     '"Literata", Georgia, serif',
  atkinson:     '"Atkinson Hyperlegible", sans-serif',
  merriweather: '"Merriweather", Georgia, serif',
  'ibm-plex':   '"IBM Plex Sans", sans-serif',
  outfit:       '"Outfit", sans-serif',
}

function getOrpIndex(word: string): number {
  const len = word.length
  if (len <= 1) return 0
  if (len <= 3) return 1
  if (len <= 5) return 2
  if (len <= 9) return 3
  if (len <= 13) return 4
  return 5
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
  const { fontSize, fontFamily, bionicReading, showContext } = useSettingsStore()

  const accentHex = 'var(--accent)'
  const fontFamilyCSS = FONT_FAMILY_MAP[fontFamily] ?? FONT_FAMILY_MAP.literata

  // Build the display word(s) — filter sentinels from the chunk
  const chunkWords = words
    .slice(currentIndex, currentIndex + chunkSize)
    .filter((w) => w !== '\n\n')
  const displayWord = chunkWords[0] ?? ''

  const orpIdx = getOrpIndex(displayWord)
  const prevWords = showContext ? getContextWords(words, currentIndex, 5, -1) : []
  const nextWords = showContext ? getContextWords(words, currentIndex + chunkSize - 1, 3, 1) : []

  // Synchronous ORP offset via canvas measurement
  const orpTranslateX = useMemo(() => {
    if (!displayWord) return 0
    const text = chunkWords.join(' ')
    if (bionicReading) {
      const { bold } = getBionicSplit(displayWord)
      return measureOrpOffsetBionic(text, orpIdx, fontSize, fontFamilyCSS, bold.length)
    }
    return measureOrpOffset(text, orpIdx, `${fontSize}px ${fontFamilyCSS}`)
  }, [displayWord, chunkWords, orpIdx, fontSize, fontFamilyCSS, bionicReading])

  const wpm = useReaderStore.getState().wpm || 300
  const disableTransition = wpm > 450

  // Render a word with ORP + optional bionic
  function renderWord(word: string, isMain: boolean) {
    if (!word) return null

    if (isMain && bionicReading) {
      const { bold } = getBionicSplit(word)
      return (
        <>
          {Array.from(word).map((char, i) => (
            <span
              key={i}
              style={{
                fontWeight: i < bold.length ? 800 : 300,
                color: i === orpIdx ? accentHex : undefined,
              }}
            >
              {char}
            </span>
          ))}
        </>
      )
    }

    if (isMain) {
      const before = word.slice(0, orpIdx)
      const orpChar = word[orpIdx] ?? ''
      const after = word.slice(orpIdx + 1)
      return (
        <>
          {before}
          <span style={{ color: accentHex }}>{orpChar}</span>
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
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden">

      {/* Fixed focus guide line — ALWAYS at 50%, never moves */}
      <div
        className="absolute top-0 bottom-0 w-px pointer-events-none z-20"
        style={{ left: '50%', backgroundColor: accentHex, opacity: 0.18 }}
      />

      {/* Top notch triangle */}
      <div
        className="absolute pointer-events-none z-20"
        style={{
          left: '50%',
          top: '50%',
          marginTop: -(fontSize * 0.6),
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '5px solid var(--accent)',
          opacity: 0.35,
        }}
      />

      {/* Bottom notch triangle */}
      <div
        className="absolute pointer-events-none z-20"
        style={{
          left: '50%',
          top: '50%',
          marginTop: fontSize * 0.15,
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: '5px solid var(--accent)',
          opacity: 0.35,
        }}
      />

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

      {/* Main word — ORP-anchored at viewport center */}
      <div
        className="z-10 leading-none whitespace-nowrap self-start"
        style={{
          position: 'relative',
          left: '50%',
          transform: `translateX(${orpTranslateX}px)`,
          transition: disableTransition ? 'none' : 'transform 50ms ease-out',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: disableTransition ? 0 : Math.min(0.1, (60_000 / wpm / 1000) * 0.4),
              ease: 'easeOut',
            }}
            style={{ fontSize, fontFamily: fontFamilyCSS }}
          >
            {chunkWords.length <= 1 ? (
              renderWord(displayWord, true)
            ) : (
              chunkWords.map((w, i) => (
                <span key={i}>{i > 0 ? ' ' : ''}{renderWord(w, i === 0)}</span>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

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
