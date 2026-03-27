import Dexie, { type EntityTable } from 'dexie'

export interface Book {
  id: number
  title: string
  fileName: string
  filePath: string
  words: string[]
  totalWords: number
  thumbnail?: Blob
  dateAdded: Date
  lastReadAt?: Date
  lastWordIndex: number
}

export interface Bookmark {
  id: number
  bookId: number
  wordIndex: number
  label?: string
  note?: string
  isAutoResume?: boolean
  createdAt: Date
}

export interface ReadingSession {
  id: number
  bookId: number
  startWordIndex: number
  endWordIndex: number
  wordsRead: number
  durationMs: number
  avgWpm: number
  date: string
  startedAt: Date
  endedAt?: Date
}

export interface Setting {
  key: string
  value: unknown
}

const db = new Dexie('FlowReaderDB') as Dexie & {
  books: EntityTable<Book, 'id'>
  bookmarks: EntityTable<Bookmark, 'id'>
  sessions: EntityTable<ReadingSession, 'id'>
  settings: EntityTable<Setting, 'key'>
}

db.version(1).stores({
  books: '++id, title, dateAdded, lastReadAt',
  bookmarks: '++id, bookId, wordIndex, createdAt',
  sessions: '++id, bookId, date, startedAt',
  settings: 'key',
})

export { db }
