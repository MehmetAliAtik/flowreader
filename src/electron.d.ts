interface FlowReaderAPI {
  importPdf: () => Promise<{ filePath: string; fileName: string } | null>
  getPdfPath: (bookId: string) => Promise<string>
  getAppDataPath: () => Promise<string>
  readFile: (filePath: string) => Promise<Uint8Array>
}

interface Window {
  flowreader: FlowReaderAPI
}
