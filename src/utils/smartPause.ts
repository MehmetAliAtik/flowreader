export function getSmartPauseMultiplier(word: string, enabled: boolean): number {
  if (!enabled) return 1.0
  if (word === '\n\n') return 2.5

  const last = word.slice(-1)
  if (last === '.' || last === '!' || last === '?') return 2.0
  if (last === ',' || last === ';' || last === ':') return 1.5
  if (word.length >= 8) return 1.3

  return 1.0
}
