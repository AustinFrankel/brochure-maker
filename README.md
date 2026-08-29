# Brochure Maker

Live: [rye-brook-brochure-maker.vercel.app](https://rye-brook-brochure-maker.vercel.app)

A browser tool for building the Rye Brook Parks & Recreation activity brochure
and exporting it as a print-ready PDF.

Three past seasons are included as editable pages, so the usual workflow is to
duplicate one, change the dates and fees, and export. You can also import any
other PDF and edit its text. There's no sign-in; open the link and start working.

![The editor](docs/editor.png)

## What it does

* Start from a past season. Fall 2025, Spring/Summer 2026 and Winter 2025-26 are
  all included.
* Import any PDF. Every page comes back with its artwork intact and its text
  turned into blocks you can retype. A 14-page brochure takes about a minute.
* Edit on the page. Click a block and type where the text sits. Select words to
  make them bold, italic, underlined, or a different color.
* Change the brand colors once, in *Theme*, and every block using them updates
  across all pages.
* The editor and the exporter share the same components and stylesheet, so the
  canvas matches what prints.
* Pages that overflow are flagged in the canvas and the page rail rather than
  silently dropping a paragraph from the PDF.
* Autosave about a second after you stop typing, with undo/redo and periodic
  restore points. Deletes are soft.
* Documents and images live in the cloud, so you can start on a laptop and finish
  on an iPad.
* Below 900px the page rail and inspector become bottom sheets, touch targets
  grow, and dragging waits for a short press so the page still scrolls.

## Getting started

```bash
npm install
npm run dev
```

That's enough to try it. With no configuration, brochures are saved to
`.data/brochures.json` on your machine and the home page tells you so.

For syncing across devices, copy `.env.example` to `.env.local` and fill in the
two Supabase values. To create the tables in a fresh Supabase project, run
`supabase/schema.sql` in its SQL editor.

**Download PDF** needs Google Chrome installed, since the app reuses it instead
of downloading its own copy. **Print / Save as PDF** works either way because it
goes through your own browser.

## Exporting

*Export* offers three things:

| | |
|---|---|
| **Download PDF** | Renders `/print/[id]` in headless Chromium. Vector text with embedded fonts, 8.5×11 Letter, no margins. |
| **Print / Save as PDF** | Opens the same page in a print dialog. On iPad, choose *Save to Files*. |
| **Save a .json backup** | The whole document. *Import* on the home page restores it. |

## How importing a PDF works

A PDF records where ink was placed, not what the author meant by it. Rebuilding a
block structure from that is guesswork, and guessing wrong quietly rearranges
someone's document. So the import splits each page in two.

1. Everything that isn't text (photos, table fills, rules, logos, borders) is
   kept exactly as drawn, by rendering the page and using it as the page
   background.
2. Every run of text is lifted off into an editable block placed at the
   coordinates the PDF gave it. The background under each run is painted out with
   the color surrounding it, so the original glyphs don't ghost through once the
   text is edited.

The result is a page that looks like the original and whose words can all be
retyped, restyled, moved or deleted.

Conversion runs in the browser rather than on the server. A 50-page PDF is more
work than a serverless function should take on, and the browser already has a
canvas and a PDF engine. Nothing in the importer throws: a page that can't be
parsed still lands as its own rendered image, so the worst case is a faithful
page that isn't editable.

## Layout

```
src/lib/types.ts        Document model: pages, blocks, placement, theme
src/lib/theme.ts        Color tokens, fonts, page geometry
src/lib/doc.ts          Block factories, defaults, migrations
src/lib/store.ts        Editor state and undo history
src/lib/db/             Supabase, with a local JSON fallback
src/lib/import/pdf.ts   PDF to editable document
src/lib/seed/           Fall 2025, hand-built from blocks
src/lib/templates/      The New menu, including the two imported seasons

src/components/render/  Shared by the editor and the PDF; the single source
                        of truth for how a page looks
src/components/editor/  Selection, drag-and-drop, inspector, overlays

src/app/print/[id]      Chrome-free render, screenshotted by the exporter
src/app/api/export      Headless Chromium to PDF
```

A document is a list of pages, and a page is a list of blocks. Blocks lay out one
of two ways:

* **Flowed.** Stacked down a one- or two-column grid, so lengthening a paragraph
  pushes what follows. The hand-built templates work this way, and it's why this
  is an editor rather than a free canvas.
* **Placed.** Pinned to fixed coordinates. Imported pages land this way. Either
  kind can be switched to the other from the inspector.

Colors are stored as tokens. A block holds `@purple` rather than `#A349A4` and
resolves it against the theme at render time, which is why one palette change
restyles the whole brochure.

### Fidelity

The Fall 2025 template was rebuilt from the original PDF with the type scale,
column geometry and line spacing measured off the source rather than guessed:
10pt Times on a 10.56pt line, 3.55in columns with a 0.12in gutter, 14pt Calibri
headings. `npm run audit:layout <id>` re-checks every page for content past the
sheet edge or table cells that wrap, and reports all fourteen clean.

Word's fonts are substituted with metric-compatible open faces (Tinos for Times
New Roman, Carlito for Calibri, Cinzel for Castellar) so line breaks land where
they did in the original.

## A note on access

There are no accounts and no login, on purpose. This is an internal tool for a
small group who all work on the same brochures, and a sign-in wall would cost
them more than it protects. The database policies and the storage bucket are open
to the anonymous key deliberately, not by oversight.

The consequence is that anyone with the URL can read and change every brochure.
If that stops being acceptable, the place to fix it is the Supabase policies in
`supabase/schema.sql` plus a login in front of the app. The storage layer behind
`src/lib/db` doesn't need to change.

## Scripts

| Command | |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run seed` | Create the three season brochures in the current store |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Sanitizer security tests |
| `npm run audit:layout <id>` | Report pages that overflow or wrap |
| `npm run shots <id> [dir]` | Render every page to PNG |
| `npm run make-template <pdf> <slug> "<Title>"` | Run a PDF through the importer and bundle the result as a template |

## Known limits

* The menorah on the Winterfest panel of the Fall 2025 template is vector art in
  the original and couldn't be extracted, so the panel carries only the tree
  image. Drop a replacement onto the block to restore it.
* On an imported page the artwork behind the text is a picture. The words on top
  are editable; the shapes behind them aren't.
* Version snapshots are taken every twentieth save and on export, not on every
  keystroke.
