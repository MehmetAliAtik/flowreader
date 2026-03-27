import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'
export type AccentColor = 'blue' | 'amber' | 'green' | 'rose' | 'violet'
export type FontFamily = 'literata' | 'atkinson' | 'merriweather' | 'ibm-plex' | 'outfit'

interface SettingsState {
  theme: ThemeMode
  fontFamily: FontFamily
  fontSize: number
  wpm: number
  chunkSize: 1 | 2 | 3
  smartPause: boolean
  bionicReading: boolean
  showContext: boolean
  accentColor: AccentColor

  setTheme: (theme: ThemeMode) => void
  setFontFamily: (font: FontFamily) => void
  setFontSize: (size: number) => void
  setWpm: (wpm: number) => void
  setChunkSize: (size: 1 | 2 | 3) => void
  setSmartPause: (enabled: boolean) => void
  setBionicReading: (enabled: boolean) => void
  setShowContext: (show: boolean) => void
  setAccentColor: (color: AccentColor) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  fontFamily: 'literata',
  fontSize: 48,
  wpm: 300,
  chunkSize: 1,
  smartPause: true,
  bionicReading: false,
  showContext: true,
  accentColor: 'blue',

  setTheme: (theme) => set({ theme }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setFontSize: (fontSize) => set({ fontSize }),
  setWpm: (wpm) => set({ wpm }),
  setChunkSize: (chunkSize) => set({ chunkSize }),
  setSmartPause: (smartPause) => set({ smartPause }),
  setBionicReading: (bionicReading) => set({ bionicReading }),
  setShowContext: (showContext) => set({ showContext }),
  setAccentColor: (accentColor) => set({ accentColor }),
}))
