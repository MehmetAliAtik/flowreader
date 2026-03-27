export interface BionicParts {
  bold: string
  rest: string
}

export function getBionicSplit(word: string): BionicParts {
  if (!word) return { bold: '', rest: '' }

  const len = word.length
  const boldCount = len <= 3 ? 1 : len <= 5 ? 2 : len <= 7 ? 3 : 4

  return {
    bold: word.slice(0, boldCount),
    rest: word.slice(boldCount),
  }
}
