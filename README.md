# Brochure Maker

A web app for building the Rye Brook Parks & Recreation activity brochure and
exporting it as a print-ready PDF.

It ships with the **Fall 2025 brochure already rebuilt** — all fourteen pages,
as editable blocks rather than a scan. Duplicate it, change the dates and fees,
and export. Nobody needs Word, InDesign, or the original file.

![The editor](docs/editor.png)

---

## What it does

- **Every page is real content.** Headings, paragraphs, schedule tables, photos,
  QR codes and form fields are separate blocks you can retype, restyle, reorder,
  or delete. Nothing is baked into an image.
- **Edit on the page.** Click a block and type where the text sits. Select words
  to bold, italicise, underline or recolour them.
- **One palette drives the whole document.** The six brand colours live in
  *Theme*; changing one restyles every block that uses it, across all fourteen
  pages.
- **The canvas is the PDF.** The editor and the exporter render the same
  components through the same stylesheet, so what you see is what prints.
- **It warns before it breaks.** A page whose content runs past the bottom is
  flagged in the canvas and in the page rail, rather than silently losing a
  paragraph in the PDF.
- **Autosave and undo.** Changes save about a second after you stop typing, with
  full undo/redo and periodic restore points. Deleting is soft — nothing is
  destroyed.
- **Works on an iPad.** Below 900px the page rail and inspector become bottom
  sheets, touch targets grow, and dragging waits for a short press so scrolling
  still works.

## Getting started

```bash
npm install
npm run seed
npm run dev
```

`npm run seed` creates the Fall 2025 brochure; `npm run dev` serves the app at
http://localhost:3000. No database or API keys are needed to try it — brochures
are stored in `.data/brochures.json` and the app says so on the home page.

For PDF export, Google Chrome must be installed (the app reuses it rather than
downloading its own copy). If it lives somewhere unusual, set `CHROME_PATH`.
The **Print / Save as PDF** button works regardless, since it goes through your
own browser.

## Exporting

*Export* offers three things:

| | |
|---|---|
| **Download PDF** | Renders `/print/[id]` in headless Chromium. Real vector text with embedded fonts, 8.5×11 Letter, no margins. |
| **Print / Save as PDF** | Opens the same page in a print dialog. Use this on an iPad — choose *Save to Files*. |
| **Save a .json backup** | The whole document. *Import .json* on the home page restores it. |

## Deploying

The app runs on Vercel as-is. Two optional integrations turn on persistence:

1. **Postgres** — set `DATABASE_URL` (Neon, Supabase, anything Postgres) and run
   `npm run db:push`. Without it the app falls back to the local JSON file,
   which is fine locally but resets on each deploy.
2. **Vercel Blob** — set `BLOB_READ_WRITE_TOKEN` so photos upload to blob
   storage. Uploads go from the browser straight to Blob, sidestepping the
   4.5MB limit on serverless request bodies; a phone photo is resized in the
   browser first. Without a token, photos under ~1MB are embedded in the
   document instead.

Copy `.env.example` to `.env` to see every setting.

## How it is put together

```
src/lib/types.ts        The document model: pages, blocks, theme
src/lib/theme.ts        Colour tokens, fonts, page geometry
src/lib/doc.ts          Block factories, defaults, migrations
src/lib/store.ts        Zustand editor state + undo history
src/lib/db/             Postgres store, with a local JSON fallback
src/lib/seed/           The Fall 2025 brochure, as data

src/components/render/  Shared by the editor and the PDF — the single
                        source of truth for how a page looks
src/components/editor/  Selection, drag-and-drop, inspector, overlays

src/app/print/[id]      Chrome-free render, screenshotted by the exporter
src/app/api/export      Headless Chromium → PDF
```

A **document** is a list of pages; a page is a list of blocks; a block declares
its type, its column, and its styling. Blocks flow down a one- or two-column
grid rather than being positioned absolutely, so editing text reflows the page
the way a document should.

**Colours are tokens.** A block stores `@purple`, not `#A349A4`, and resolves it
against the theme at render time — which is why one palette change restyles the
whole brochure.

### Fidelity

The bundled brochure was rebuilt from the original PDF, with the type scale,
column geometry and line spacing measured off the source rather than guessed:
10pt Times on a 10.56pt line, 3.55in columns with a 0.12in gutter, 14pt Calibri
headings. `npm run audit:layout <id>` re-checks every page for content that
overflows the sheet or table cells that wrap, and currently reports all fourteen
pages clean.

## Scripts

| Command | |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run seed` | Create the Fall 2025 brochure |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:push` | Push the schema to `DATABASE_URL` |
| `npm run audit:layout <id>` | Report pages that overflow or wrap |
| `npm run shots <id> [dir]` | Render every page to PNG |

## Known limits

- The menorah on the Winterfest panel (page 7) is vector art in the original and
  could not be extracted; the panel currently carries only the tree image. Drop
  a replacement onto the block to restore it.
- Version snapshots are taken every twentieth save and on export, not on every
  keystroke.
