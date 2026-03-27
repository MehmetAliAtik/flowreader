import { useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { processPages } from '@/utils/textProcessor'

// Configure worker via Vite's ?url import for correct asset handling
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const THUMBNAIL_MAX_WIDTH = 400

export interface PdfParseResult {
  words: string[]
  totalWords: number
  thumbnail: Blob
}

export function usePdfParser() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsePdf = useCallback(async (filePath: string): Promise<PdfParseResult> => {
    setIsLoading(true)
    setError(null)

    try {
      // Load the PDF file via IPC (main process reads from disk)
      const data = await window.flowreader.readFile(filePath)
      const pdf = await pdfjsLib.getDocument({ data }).promise

      // --- Text Extraction ---
      const rawPages: string[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const content = await page.getTextContent()

        let pageText = ''
        for (const item of content.items) {
          if ('str' in item) {
            const textItem = item as TextItem
            pageText += textItem.str
            if (textItem.hasEOL) pageText += '\n'
            else pageText += ' '
          }
        }

        rawPages.push(pageText)
      }

      // --- Thumbnail Generation (page 1) ---
      const page1 = await pdf.getPage(1)
      const naturalViewport = page1.getViewport({ scale: 1.0 })
      const scale = Math.min(1.0, THUMBNAIL_MAX_WIDTH / naturalViewport.width)
      const viewport = page1.getViewport({ scale })

      let thumbnail: Blob

      if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(Math.floor(viewport.width), Math.floor(viewport.height))
        const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D
        await page1.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise
        thumbnail = await canvas.convertToBlob({ type: 'image/png' })
      } else {
        // Fallback for environments without OffscreenCanvas
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const ctx = canvas.getContext('2d')!
        await page1.render({ canvasContext: ctx, viewport }).promise
        thumbnail = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas toBlob failed'))
          }, 'image/png')
        })
      }

      // --- Text Processing ---
      const { words, totalWords } = processPages(rawPages)

      return { words, totalWords, thumbnail }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse PDF'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { parsePdf, isLoading, error }
}
