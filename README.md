# FlowReader

A desktop speed reader for PDFs, built around RSVP (Rapid Serial Visual Presentation): words are shown one at a time at a fixed point on screen, so your eyes stay still and you read faster.

## Download

Windows (x64) builds are on the [Releases page](https://github.com/MehmetAliAtik/flowreader/releases/latest):

- **FlowReader.Setup.x.y.z.exe**: installer.
- **FlowReader-x.y.z-win-x64-portable.zip**: no installation needed. Extract it and run `FlowReader.exe`.

The builds are not code-signed, so Windows SmartScreen may warn about an unknown publisher. Choose **More info**, then **Run anyway**.

## Features

- Import PDF books into a local library; everything stays on your machine.
- RSVP reader with adjustable speed (words per minute) and 1 to 3 words per flash.
- Smart pausing: longer pauses on punctuation and long words.
- Bionic Reading mode and optional context words around the current word.
- Bookmarks per book.
- Reading stats, streaks and a daily goal.
- Light, dark and system themes, five accent colors and five reading fonts.

### Keyboard shortcuts (reader)

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `Left` / `Right` | Skip back / forward 10 words |
| `Up` / `Down` | Speed up / slow down by 25 wpm |
| `B` | Add a bookmark |
| `Esc` | Pause and leave the reader |

## Development

Requires Node.js 20.19 or newer (22.12+ also works).

```bash
npm install
npm run dev        # starts Vite and opens the Electron window
npm run build      # type-check and build the renderer and Electron code
npm run package    # build and create an installer in release/
```

### Tech stack

Electron, React, TypeScript, Vite, Tailwind CSS, Zustand, Dexie (IndexedDB) and pdf.js.

## License

ISC, as declared in `package.json`.
