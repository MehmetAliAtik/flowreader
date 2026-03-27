import { create } from 'zustand'
import { useSettingsStore } from './settingsStore'

interface ReaderState {
  bookId: number | null
  words: string[]
  currentIndex: number
  isPlaying: boolean
  wpm: number
  chunkSize: 1 | 2 | 3

  load: (bookId: number, words: string[], startIndex: number, wpm: number, chunkSize?: 1 | 2 | 3) => void
  setCurrentIndex: (i: number) => void
  setPlaying: (p: boolean) => void
  setWpm: (wpm: number) => void
  reset: () => void
}

export const useReaderStore = create<ReaderState>((set) => ({
  bookId: null,
  words: [],
  currentIndex: 0,
  isPlaying: false,
  wpm: 300,
  chunkSize: 1,

  load: (bookId, words, startIndex, wpm, chunkSize) =>
    set({
      bookId,
      words,
      currentIndex: Math.max(0, startIndex),
      isPlaying: false,
      wpm,
      chunkSize: chunkSize ?? (useSettingsStore.getState().chunkSize as 1 | 2 | 3),
    }),

  setCurrentIndex: (currentIndex) => set({ currentIndex }),

  setPlaying: (isPlaying) => set({ isPlaying }),

  setWpm: (wpm) => {
    const clamped = Math.max(100, Math.min(1000, wpm))
    set({ wpm: clamped })
    // Keep settings store in sync so preference persists
    useSettingsStore.getState().setWpm(clamped)
  },

  reset: () =>
    set({ bookId: null, words: [], currentIndex: 0, isPlaying: false }),
}))
