import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('flowreader', {
  importPdf: () => ipcRenderer.invoke('import-pdf'),
  getPdfPath: (bookId: string) => ipcRenderer.invoke('get-pdf-path', bookId),
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
})
