export interface ProcessedText {
  words: string[]
  totalWords: number
}

const PARAGRAPH_SENTINEL = '\n\n'

/**
 * Detect lines that appear on more than `threshold` fraction of pages.
 * These are likely repeated headers/footers.
 */
function detectRepeatedLines(pages: string[], threshold = 0.6): Set<string> {
  const lineCount = new Map<string, number>()
  const total = pages.length

  for (const page of pages) {
    const seen = new Set<string>()
    for (const raw of page.split('\n')) {
      const line = raw.trim()
      if (line.length > 0 && !seen.has(line)) {
        seen.add(line)
        lineCount.set(line, (lineCount.get(line) ?? 0) + 1)
      }
    }
  }

  const repeated = new Set<string>()
  for (const [line, count] of lineCount) {
    if (count / total > threshold) repeated.add(line)
  }
  return repeated
}

/**
 * Normalize unicode whitespace and fix hyphenated line breaks.
 */
function normalizePage(raw: string): string {
  // Replace unicode whitespace variants with regular space
  let text = raw.replace(/[\u00A0\u00AD\u200B\u2009\u202F\uFEFF]/g, ' ')

  // Rejoin hyphenated line breaks: "compre-\nhension" → "comprehension"
  text = text.replace(/-\n([a-z])/g, '$1')

  return text
}

/**
 * Process raw per-page text strings into a clean flat word array
 * with paragraph sentinel tokens ('\n\n') at boundaries.
 */
export function processPages(rawPages: string[]): ProcessedText {
  if (rawPages.length === 0) return { words: [], totalWords: 0 }

  const repeated = detectRepeatedLines(rawPages)
  const result: string[] = []
  let wordCount = 0

  for (let i = 0; i < rawPages.length; i++) {
    const normalized = normalizePage(rawPages[i])
    const lines = normalized.split('\n')

    let blankRun = 0
    let pageWords: string[] = []

    for (const rawLine of lines) {
      const line = rawLine.trim()

      // Skip repeated headers/footers
      if (repeated.has(line)) continue

      if (line.length === 0) {
        blankRun++
        if (blankRun >= 2 && pageWords.length > 0) {
          // Paragraph break within a page
          pageWords.push(PARAGRAPH_SENTINEL)
        }
        continue
      }

      blankRun = 0
      const words = line.split(/\s+/).filter((w) => w.length > 0)
      pageWords.push(...words)
    }

    // Remove trailing sentinel from page
    while (pageWords[pageWords.length - 1] === PARAGRAPH_SENTINEL) {
      pageWords.pop()
    }

    if (pageWords.length === 0) continue

    // Add paragraph boundary between pages (if there's content already)
    if (result.length > 0 && result[result.length - 1] !== PARAGRAPH_SENTINEL) {
      result.push(PARAGRAPH_SENTINEL)
    }

    for (const w of pageWords) {
      result.push(w)
      if (w !== PARAGRAPH_SENTINEL) wordCount++
    }
  }

  // Remove leading/trailing sentinels
  while (result[0] === PARAGRAPH_SENTINEL) result.shift()
  while (result[result.length - 1] === PARAGRAPH_SENTINEL) result.pop()

  // Deduplicate adjacent sentinels
  const deduped: string[] = []
  for (const w of result) {
    if (w === PARAGRAPH_SENTINEL && deduped[deduped.length - 1] === PARAGRAPH_SENTINEL) continue
    deduped.push(w)
  }

  return { words: deduped, totalWords: wordCount }
}

/**
 * Derive a display title from a PDF filename.
 * "my-great_book.pdf" → "My Great Book"
 */
export function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
