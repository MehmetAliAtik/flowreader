import { useCallback, useEffect, useRef } from 'react'
import { useReaderStore } from '@/stores/readerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getSmartPauseMultiplier } from '@/utils/smartPause'

function computeInterval(word: string, wpm: number, smartPause: boolean): number {
  const base = 60_000 / wpm
  return base * getSmartPauseMultiplier(word, smartPause)
}

export function useRSVP() {
  // --- Refs (all mutable state for the RAF loop) ---
  const wordsRef        = useRef<string[]>([])
  const indexRef        = useRef(0)
  const isPlayingRef    = useRef(false)
  const wpmRef          = useRef(300)
  const smartPauseRef   = useRef(true)
  const chunkSizeRef    = useRef<1 | 2 | 3>(1)
  const accumulatedRef  = useRef(0)
  const lastTsRef       = useRef<number | null>(null)
  const targetIntervalRef = useRef(200)
  const rafIdRef        = useRef<number | null>(null)

  // Sync refs from stores every render (synchronous, before RAF fires)
  const { words, currentIndex, isPlaying, wpm, chunkSize } = useReaderStore()
  const { smartPause } = useSettingsStore()

  wordsRef.current      = words
  isPlayingRef.current  = isPlaying
  wpmRef.current        = wpm
  smartPauseRef.current = smartPause
  chunkSizeRef.current  = chunkSize

  // Only sync indexRef from store when external changes happen
  // (RAF loop updates both the ref and the store, so normally they agree)
  if (Math.abs(indexRef.current - currentIndex) > 1) {
    indexRef.current = currentIndex
  }

  // --- Core advance function ---
  const advance = useCallback(() => {
    const words = wordsRef.current
    let next = indexRef.current + chunkSizeRef.current

    // If landing on a sentinel, apply its pause and step past it
    if (next < words.length && words[next] === '\n\n') {
      targetIntervalRef.current = computeInterval('\n\n', wpmRef.current, smartPauseRef.current)
      next++
    }

    // End of book
    if (next >= words.length) {
      isPlayingRef.current = false
      useReaderStore.getState().setPlaying(false)
      useReaderStore.getState().setCurrentIndex(Math.max(0, words.length - 1))
      return
    }

    indexRef.current = next
    useReaderStore.getState().setCurrentIndex(next)

    // Compute interval for the word we just landed on
    const word = words[next]
    targetIntervalRef.current = computeInterval(word, wpmRef.current, smartPauseRef.current)
  }, [])

  // --- RAF tick ---
  const tick = useCallback((timestamp: number) => {
    if (!isPlayingRef.current) return

    if (lastTsRef.current === null) {
      lastTsRef.current = timestamp
      rafIdRef.current = requestAnimationFrame(tick)
      return
    }

    const delta = Math.min(timestamp - lastTsRef.current, 250) // clamp tab-switch spikes
    lastTsRef.current = timestamp
    accumulatedRef.current += delta

    if (accumulatedRef.current >= targetIntervalRef.current) {
      accumulatedRef.current -= targetIntervalRef.current
      advance()
    }

    if (isPlayingRef.current) {
      rafIdRef.current = requestAnimationFrame(tick)
    }
  }, [advance])

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  // --- Public API ---
  const pause = useCallback(() => {
    isPlayingRef.current = false
    useReaderStore.getState().setPlaying(false)
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  const play = useCallback(() => {
    if (isPlayingRef.current) return
    // Pre-compute interval for current word before first tick
    const words = wordsRef.current
    const word = words[indexRef.current] ?? ''
    targetIntervalRef.current = computeInterval(word, wpmRef.current, smartPauseRef.current)

    isPlayingRef.current = true
    lastTsRef.current = null
    accumulatedRef.current = 0
    useReaderStore.getState().setPlaying(true)
    rafIdRef.current = requestAnimationFrame(tick)
  }, [tick])

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) pause()
    else play()
  }, [play, pause])

  const skipForward = useCallback((n: number) => {
    pause()
    const words = wordsRef.current
    let next = Math.min(indexRef.current + n, words.length - 1)
    // Skip past any sentinel we land on
    while (next < words.length - 1 && words[next] === '\n\n') next++
    indexRef.current = next
    useReaderStore.getState().setCurrentIndex(next)
  }, [pause])

  const skipBackward = useCallback((n: number) => {
    pause()
    let prev = Math.max(indexRef.current - n, 0)
    const words = wordsRef.current
    while (prev > 0 && words[prev] === '\n\n') prev--
    indexRef.current = prev
    useReaderStore.getState().setCurrentIndex(prev)
  }, [pause])

  const seekTo = useCallback((index: number) => {
    pause()
    const words = wordsRef.current
    let i = Math.max(0, Math.min(index, words.length - 1))
    while (i < words.length - 1 && words[i] === '\n\n') i++
    indexRef.current = i
    useReaderStore.getState().setCurrentIndex(i)
  }, [pause])

  const setWpm = useCallback((wpm: number) => {
    useReaderStore.getState().setWpm(wpm) // also syncs to settingsStore
  }, [])

  return { play, pause, togglePlay, skipForward, skipBackward, seekTo, setWpm }
}
