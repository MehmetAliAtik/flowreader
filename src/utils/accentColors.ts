import type { AccentColor } from '@/stores/settingsStore'

/** Light-mode accent hex values */
export const ACCENT_LIGHT: Record<AccentColor, string> = {
  goldenrod: '#B8860B',
  amber:     '#C4842D',
  sage:      '#6B8F60',
  clay:      '#C47055',
  plum:      '#8B6B8F',
}

/** Dark-mode accent hex values (slightly brighter for contrast) */
export const ACCENT_DARK: Record<AccentColor, string> = {
  goldenrod: '#D4A853',
  amber:     '#D4963A',
  sage:      '#8AAF7E',
  clay:      '#D4836B',
  plum:      '#A98DAD',
}

/** Soft (18% opacity) version as CSS rgba */
function toSoft(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.10)`
}

function toGlow(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.20)`
}

/** Apply accent CSS variables to :root for the given accent + isDark state */
export function applyAccentVars(accent: AccentColor, isDark: boolean): void {
  const hex  = (isDark ? ACCENT_DARK[accent] : ACCENT_LIGHT[accent]) ?? (isDark ? ACCENT_DARK.goldenrod : ACCENT_LIGHT.goldenrod)
  const soft = toSoft(hex)
  const glow = toGlow(hex)
  const root = document.documentElement
  root.style.setProperty('--accent', hex)
  root.style.setProperty('--accent-soft', soft)
  root.style.setProperty('--accent-glow', glow)
}

/** Get current hex for inline styles that can't use CSS vars */
export function getAccentColor(accent: AccentColor, isDark = false): string {
  return isDark ? ACCENT_DARK[accent] : ACCENT_LIGHT[accent]
}

export const ACCENT_LABELS: Record<AccentColor, string> = {
  goldenrod: 'Goldenrod',
  amber:     'Amber',
  sage:      'Sage',
  clay:      'Clay',
  plum:      'Plum',
}
