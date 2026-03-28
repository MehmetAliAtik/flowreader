import { useEffect } from 'react'
import { db } from '@/db/database'
import { useSettingsStore, type AccentColor } from '@/stores/settingsStore'

const VALID_ACCENTS: AccentColor[] = ['goldenrod', 'amber', 'sage', 'clay', 'plum']

const SETTINGS_KEY = 'userSettings'

/**
 * Loads persisted settings from Dexie on mount, then subscribes to
 * any store change and saves the full settings object back to Dexie.
 * Call once at the app root.
 */
export function useSettingsPersistence() {
  useEffect(() => {
    // Load on mount
    db.settings.get(SETTINGS_KEY).then((row) => {
      if (!row) return
      const saved = row.value as Record<string, unknown>
      const store = useSettingsStore.getState()

      if (saved.theme)         store.setTheme(saved.theme as never)
      if (saved.fontFamily)    store.setFontFamily(saved.fontFamily as never)
      if (saved.fontSize)      store.setFontSize(saved.fontSize as number)
      if (saved.wpm)           store.setWpm(saved.wpm as number)
      if (saved.chunkSize)     store.setChunkSize(saved.chunkSize as never)
      if (saved.accentColor && VALID_ACCENTS.includes(saved.accentColor as AccentColor))
        store.setAccentColor(saved.accentColor as AccentColor)
      if (typeof saved.smartPause    === 'boolean') store.setSmartPause(saved.smartPause)
      if (typeof saved.bionicReading === 'boolean') store.setBionicReading(saved.bionicReading)
      if (typeof saved.showContext   === 'boolean') store.setShowContext(saved.showContext)
      if (saved.dailyGoal)           store.setDailyGoal(saved.dailyGoal as number)
      if (typeof saved.sidebarPinned === 'boolean') store.setSidebarPinned(saved.sidebarPinned)
    })

    // Subscribe: save on every change
    const unsubscribe = useSettingsStore.subscribe((state) => {
      const { setTheme, setFontFamily, setFontSize, setWpm, setChunkSize,
              setSmartPause, setBionicReading, setShowContext, setAccentColor,
              setDailyGoal, setSidebarPinned, ...rest } = state
      db.settings.put({ key: SETTINGS_KEY, value: rest })
    })

    return unsubscribe
  }, [])
}
