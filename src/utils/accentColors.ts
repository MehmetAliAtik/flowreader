import type { AccentColor } from '@/stores/settingsStore'

export const ACCENT_COLOR_MAP: Record<AccentColor, string> = {
  blue:   '#3B82F6',
  amber:  '#F59E0B',
  green:  '#22C55E',
  rose:   '#F43F5E',
  violet: '#8B5CF6',
}

export function getAccentColor(accent: AccentColor): string {
  return ACCENT_COLOR_MAP[accent]
}
