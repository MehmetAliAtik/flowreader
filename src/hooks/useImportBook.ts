import { useState, useCallback } from 'react'
import { usePdfParser } from './usePdfParser'
import { db } from '@/db/database'
import { titleFromFileName } from '@/utils/textProcessor'

export function useImportBook(onSuccess?: () => void) {
  const { parsePdf, isLoading } = usePdfParser()
  const [error, setError] = useState<string | null>(null)

  const importFromPath = useCallback(
    async (filePath: string, fileName: string) => {
      setError(null)
      try {
        const title = titleFromFileName(fileName)
        const { words, totalWords, thumbnail } = await parsePdf(filePath)
        await db.books.add({
          title,
          fileName,
          filePath,
          words,
          totalWords,
          thumbnail,
          dateAdded: new Date(),
          lastWordIndex: 0,
        })
        onSuccess?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed')
      }
    },
    [parsePdf, onSuccess],
  )

  const importFromDialog = useCallback(async () => {
    setError(null)
    const result = await window.flowreader.importPdf()
    if (!result) return
    await importFromPath(result.filePath, result.fileName)
  }, [importFromPath])

  return { importFromDialog, importFromPath, isLoading, error }
}
