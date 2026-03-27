import { ipcMain, dialog, app } from 'electron'
import path from 'path'
import fs from 'fs'

export function registerFileHandlers() {
  ipcMain.handle('import-pdf', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select a PDF file',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const sourcePath = result.filePaths[0]
    const fileName = path.basename(sourcePath)
    const booksDir = path.join(app.getPath('userData'), 'books')

    if (!fs.existsSync(booksDir)) {
      fs.mkdirSync(booksDir, { recursive: true })
    }

    const destPath = path.join(booksDir, fileName)
    fs.copyFileSync(sourcePath, destPath)

    return { filePath: destPath, fileName }
  })

  ipcMain.handle('get-pdf-path', (_event, bookId: string) => {
    return path.join(app.getPath('userData'), 'books', bookId)
  })

  ipcMain.handle('get-app-data-path', () => {
    return app.getPath('userData')
  })

  ipcMain.handle('read-file', (_event, filePath: string) => {
    const data = fs.readFileSync(filePath)
    // Uint8Array.from creates an independent copy — avoids sending the
    // entire shared Node.js memory pool buffer over IPC
    return Uint8Array.from(data)
  })
}
