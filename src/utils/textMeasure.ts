let ctx: CanvasRenderingContext2D | null = null

function getCtx(): CanvasRenderingContext2D {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d')!
  return ctx
}

/**
 * Measure the translateX offset needed to center the ORP character
 * at position 0 (viewport center). Returns a negative number.
 * Used when bionic reading is OFF (uniform font weight).
 */
export function measureOrpOffset(
  word: string,
  orpIndex: number,
  fontStyle: string,
): number {
  const c = getCtx()
  c.font = fontStyle
  const beforeWidth = c.measureText(word.slice(0, orpIndex)).width
  const orpHalfWidth = c.measureText(word[orpIndex] ?? '').width / 2
  return -(beforeWidth + orpHalfWidth)
}

/**
 * Measure the translateX offset when bionic reading is ON.
 * Characters before `boldCount` use weight 800, rest use 300.
 * Measures char-by-char to account for weight differences.
 */
export function measureOrpOffsetBionic(
  word: string,
  orpIndex: number,
  fontSize: number,
  fontFamily: string,
  boldCount: number,
): number {
  const c = getCtx()
  let offset = 0
  for (let i = 0; i < orpIndex; i++) {
    c.font = `${i < boldCount ? 800 : 300} ${fontSize}px ${fontFamily}`
    offset += c.measureText(word[i]).width
  }
  const orpWeight = orpIndex < boldCount ? 800 : 300
  c.font = `${orpWeight} ${fontSize}px ${fontFamily}`
  offset += c.measureText(word[orpIndex] ?? '').width / 2
  return -offset
}
