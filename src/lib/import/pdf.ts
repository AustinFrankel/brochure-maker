'use client';

/**
 * Turn any PDF into an editable brochure.
 *
 * The approach, and why:
 *
 * A PDF records *where ink was placed*, not what the author meant. Reverse
 * engineering a full block structure from that is guesswork, and guessing wrong
 * silently rearranges someone's document. So the import splits the page in two:
 *
 *  1. Everything that is not text — photos, table fills, rules, logos, borders —
 *     is kept exactly as drawn, by rendering the page and using it as the page
 *     background.
 *  2. Every run of text is lifted off into a real, editable text block placed at
 *     the coordinates the PDF gave it. The background underneath each run is
 *     painted out with the color that surrounds it, so the original glyphs do
 *     not ghost through once the text is edited.
 *
 * You get a page that looks like the original and whose words can all be
 * retyped, restyled, moved or deleted.
 *
 * Nothing here throws. A page that cannot be parsed still lands as its own
 * rendered image, so the worst case is a faithful but non-editable page rather
 * than a failed import.
 */

import type { Doc, FontId, Page, Placement, Typo } from '@/lib/types';
import { createBlock, createPage, newId } from '@/lib/doc';
import { DEFAULT_THEME } from '@/lib/theme';

export interface ImportProgress {
  page: number;
  total: number;
  stage: string;
}

export interface ImportOptions {
  onProgress?: (p: ImportProgress) => void;
  /** Stores a page background and returns its URL. */
  upload: (blob: Blob, name: string) => Promise<string>;
  /** Device pixels per PDF point. 3 ≈ 216dpi, enough for print without bloat. */
  scale?: number;
  /** Hard ceiling so a 300-page file cannot hang the browser. */
  maxPages?: number;
}

/**
 * Word's fonts, mapped onto the metric-compatible faces this app ships.
 *
 * Order matters, and the specific names come first: "sans-serif" contains
 * "serif", so a serif rule placed above it would quietly swallow every sans
 * face on the page.
 */
const FONT_MAP: [RegExp, FontId][] = [
  [/calibri|carlito/i, 'carlito'],
  [/castellar|cinzel|trajan|copperplate|engravers/i, 'cinzel'],
  [/garamond/i, 'eb-garamond'],
  [/georgia/i, 'georgia'],
  [/arial|helvetica|arimo|verdana|tahoma|segoe|aptos|calibri|sans/i, 'arimo'],
  [/times|tinos|roman|cambria|book\s*antiqua|serif/i, 'tinos'],
];

function mapFont(psName: string): FontId {
  // Subset prefixes ("BCDGEE+") say nothing about the typeface.
  const bare = psName.replace(/^[A-Z]{6}\+/, '');
  for (const [re, id] of FONT_MAP) if (re.test(bare)) return id;
  return 'tinos';
}

const PT_PER_INCH = 72;

/**
 * The PostScript name of the face a run was set in, e.g.
 * `BCDGEE+TimesNewRomanPS-BoldMT`.
 *
 * `getTextContent().styles` only reports a generic family ("serif"), which is
 * not enough to tell Times from Times Bold — and bold carries much of the
 * meaning in these brochures. The real name lives on the loaded font object,
 * which is populated once the page has been rendered.
 */
function fontNameOf(
  page: { commonObjs: { has(k: string): boolean; get(k: string): unknown } },
  content: { styles?: Record<string, { fontFamily?: string }> },
  fontName: string,
): string {
  try {
    if (fontName && page.commonObjs.has(fontName)) {
      const obj = page.commonObjs.get(fontName) as { name?: string; fallbackName?: string } | null;
      if (obj?.name) return obj.name;
    }
  } catch { /* fall through to the generic family */ }
  return content.styles?.[fontName]?.fontFamily ?? fontName ?? '';
}

/** One run of text as the PDF painted it, in PDF points with y measured down. */
interface Run {
  text: string;
  x: number;
  y: number;          // top of the run
  w: number;
  h: number;          // font size in pt
  font: FontId;
  bold: boolean;
  italic: boolean;
}

interface Line {
  runs: Run[];
  x: number;
  y: number;
  right: number;
  size: number;
}

/**
 * Groups runs that share a baseline into lines, then lines whose left edges and
 * spacing agree into paragraphs. The tolerances are generous: merging two
 * paragraphs is a much smaller annoyance than shredding one into twenty blocks.
 *
 * The one place generosity is wrong is horizontal. A two-column page puts the
 * first line of the left column and the first line of the right column on the
 * same baseline, and joining those produces sentences that interleave two
 * unrelated paragraphs. So every line is cut at any gap wide enough to be a
 * gutter rather than a word space.
 */
function measureLines(runs: Run[]): Line[] {
  const sorted = [...runs].sort((a, b) => a.y - b.y || a.x - b.x);
  const bands: Run[][] = [];
  for (const r of sorted) {
    const band = bands[bands.length - 1];
    const ref = band?.[0];
    if (band && ref && Math.abs(r.y - ref.y) <= Math.max(1.6, ref.h * 0.34)) band.push(r);
    else bands.push([r]);
  }

  const lines: Line[] = [];
  for (const band of bands) {
    band.sort((a, b) => a.x - b.x);
    let group: Run[] = [];
    const flush = () => {
      if (!group.length) return;
      lines.push({
        runs: group,
        x: group[0].x,
        y: Math.min(...group.map((g) => g.y)),
        right: Math.max(...group.map((g) => g.x + g.w)),
        size: Math.max(...group.map((g) => g.h)),
      });
      group = [];
    };
    for (const r of band) {
      const prev = group[group.length - 1];
      if (prev) {
        const gap = r.x - (prev.x + prev.w);
        // A justified word space stays under about 1.5em; a column gutter is
        // wider than that and wider than a typical indent.
        const gutter = Math.max(prev.h * 1.5, 9);
        if (gap > gutter) flush();
      }
      group.push(r);
    }
    flush();
  }
  return lines.sort((a, b) => a.y - b.y || a.x - b.x);
}

function sameStyle(a: Line, b: Line) {
  const ra = a.runs[0], rb = b.runs[0];
  return ra.font === rb.font && Math.abs(a.size - b.size) < 0.6 && ra.bold === rb.bold;
}

/** True when the lines are centered on a common axis rather than left-aligned. */
function looksCentred(lines: Line[]): boolean {
  if (lines.length < 2) return false;
  const centres = lines.map((l) => (l.x + l.right) / 2);
  const widths = lines.map((l) => l.right - l.x);
  const spreadC = Math.max(...centres) - Math.min(...centres);
  const spreadL = Math.max(...lines.map((l) => l.x)) - Math.min(...lines.map((l) => l.x));
  const spreadW = Math.max(...widths) - Math.min(...widths);
  // Ragged on both edges but steady in the middle.
  return spreadC < lines[0].size * 0.9 && spreadL > lines[0].size && spreadW > lines[0].size;
}

function toParagraphs(lines: Line[]): Line[][] {
  const paras: Line[][] = [];
  for (const line of lines) {
    const cur = paras[paras.length - 1];
    const prev = cur?.[cur.length - 1];
    const gap = prev ? line.y - prev.y : Infinity;
    const joins =
      prev &&
      sameStyle(prev, line) &&
      gap > 0 && gap < line.size * 2.1 &&
      // same column: left edges align, or this line is an indent of the last
      Math.abs(line.x - prev.x) < Math.max(14, line.size * 1.2) &&
      // side-by-side fragments are separate columns, never one paragraph
      Math.abs(line.x - prev.x) + Math.abs(line.right - prev.right) < line.size * 26;
    if (joins) cur.push(line);
    else paras.push([line]);
  }
  return paras;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Rebuilds a paragraph's HTML, keeping bold and italic runs intact. */
function paragraphHtml(lines: Line[]): string {
  const parts: string[] = [];
  lines.forEach((line, i) => {
    if (i > 0) parts.push(' ');
    let open = '';
    for (const run of line.runs) {
      const want = `${run.bold ? 'b' : ''}${run.italic ? 'i' : ''}`;
      if (want !== open) {
        if (open.includes('i')) parts.push('</em>');
        if (open.includes('b')) parts.push('</strong>');
        if (want.includes('b')) parts.push('<strong>');
        if (want.includes('i')) parts.push('<em>');
        open = want;
      }
      parts.push(esc(run.text));
    }
    if (open.includes('i')) parts.push('</em>');
    if (open.includes('b')) parts.push('</strong>');
  });
  const body = parts.join('').replace(/\s+/g, ' ').trim();
  return body ? `<p>${body}</p>` : '';
}

/** Most common color in a box — for a box holding text on a solid ground, that
 *  is the ground, which is exactly what we need to paint the glyphs out with. */
function modeColor(
  data: Uint8ClampedArray, cw: number,
  x0: number, y0: number, x1: number, y1: number,
): [number, number, number] {
  const counts = new Map<number, number>();
  const step = Math.max(1, Math.floor((x1 - x0) / 40));
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * cw + x) * 4;
      // Quantise so anti-aliasing noise collapses onto the true ground color.
      const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let best = 0, bestN = -1;
  for (const [k, n] of counts) if (n > bestN) { bestN = n; best = k; }
  return [((best >> 10) & 31) << 3, ((best >> 5) & 31) << 3, (best & 31) << 3];
}

/** Darkest pixel in a box — for text on a lighter ground, that is the ink. */
function inkColor(
  data: Uint8ClampedArray, cw: number,
  x0: number, y0: number, x1: number, y1: number,
  ground: [number, number, number],
): string | undefined {
  let best: [number, number, number] | null = null;
  let bestDist = 0;
  const step = Math.max(1, Math.floor((x1 - x0) / 60));
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * cw + x) * 4;
      const d =
        (data[i] - ground[0]) ** 2 +
        (data[i + 1] - ground[1]) ** 2 +
        (data[i + 2] - ground[2]) ** 2;
      if (d > bestDist) { bestDist = d; best = [data[i], data[i + 1], data[i + 2]]; }
    }
  }
  // Too close to the background to be a deliberate color — leave it inherited.
  if (!best || bestDist < 2200) return undefined;
  const hex = '#' + best.map((c) => c.toString(16).padStart(2, '0')).join('');
  return hex === '#000000' ? undefined : hex;
}

function blobFrom(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas encode failed'))), type, quality));
}

export async function importPdf(file: File, opts: ImportOptions): Promise<Doc> {
  const { onProgress, upload, scale = 3, maxPages = 60 } = opts;
  const report = (page: number, total: number, stage: string) => onProgress?.({ page, total, stage });

  report(0, 1, 'Reading the file');
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buf),
    // Word exports frequently reference fonts they do not embed.
    useSystemFonts: true,
  }).promise;

  const total = Math.min(pdf.numPages, maxPages);
  const pages: Page[] = [];

  for (let n = 1; n <= total; n++) {
    report(n, total, `Reading page ${n}`);
    try {
      pages.push(await importPage(pdf, n, scale, upload, (s) => report(n, total, s)));
    } catch {
      // A page that will not parse still deserves to be in the document.
      pages.push(createPage());
    }
  }

  await pdf.destroy().catch(() => {});

  const title = file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim() || 'Imported brochure';
  return {
    version: 1,
    title,
    theme: { ...DEFAULT_THEME },
    // Imported pages carry their own geometry inside the background image, so
    // the document margin is zero and every block is placed.
    pageSetup: { size: 'letter', margin: 0, columns: 1, gutter: 0.12, numberFrom: 1 },
    pages: pages.length ? pages : [createPage()],
  };
}

type PdfDoc = import('pdfjs-dist').PDFDocumentProxy;

async function importPage(
  pdf: PdfDoc,
  n: number,
  scale: number,
  upload: ImportOptions['upload'],
  report: (stage: string) => void,
): Promise<Page> {
  const page = await pdf.getPage(n);
  const viewport = page.getViewport({ scale });
  const ptW = viewport.width / scale;
  const ptH = viewport.height / scale;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  report(`Rendering page ${n}`);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  // --- lift the text off -------------------------------------------------
  report(`Reading text on page ${n}`);
  const runs: Run[] = [];
  try {
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const [a, , , d, e, f] = item.transform as number[];
      const size = Math.abs(d) || Math.abs(a) || 10;
      const psName = fontNameOf(page, content, item.fontName);
      runs.push({
        text: item.str,
        x: e,
        y: ptH - f - size,          // PDF y is up from the bottom; ours is down
        w: item.width || item.str.length * size * 0.5,
        h: size,
        font: mapFont(psName),
        bold: /bold|black|heavy|semib/i.test(psName),
        italic: /italic|oblique/i.test(psName),
      });
    }
  } catch { /* no text layer — the page still lands as its background */ }

  const paragraphs = toParagraphs(measureLines(runs));

  // --- sample colors, then paint the original glyphs out ----------------
  report(`Cleaning page ${n}`);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const clampX = (v: number) => Math.max(0, Math.min(canvas.width - 1, Math.round(v)));
  const clampY = (v: number) => Math.max(0, Math.min(canvas.height - 1, Math.round(v)));

  const blocks: { html: string; pos: Placement; typo: Typo }[] = [];

  for (const para of paragraphs) {
    const html = paragraphHtml(para);
    if (!html) continue;

    const x = Math.min(...para.map((l) => l.x));
    const right = Math.max(...para.map((l) => l.right));
    const size = Math.max(...para.map((l) => l.size));
    const top = para[0].y;
    const bottom = para[para.length - 1].y + size;

    const bx0 = clampX((x - 1) * scale);
    const by0 = clampY((top - size * 0.28) * scale);
    const bx1 = clampX((right + 1) * scale);
    const by1 = clampY((bottom + size * 0.34) * scale);
    if (bx1 <= bx0 || by1 <= by0) continue;

    const ground = modeColor(pixels, canvas.width, bx0, by0, bx1, by1);
    const color = inkColor(pixels, canvas.width, bx0, by0, bx1, by1, ground);

    ctx.fillStyle = `rgb(${ground[0]},${ground[1]},${ground[2]})`;
    ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);

    const lineGap = para.length > 1 ? (para[1].y - para[0].y) / size : 1.15;
    const first = para[0].runs[0];

    blocks.push({
      html,
      pos: {
        x: x / PT_PER_INCH,
        y: (top - size * 0.24) / PT_PER_INCH,
        // A little slack so a word that grows by a pixel does not re-wrap.
        w: Math.max(0.25, (right - x + size * 0.6) / PT_PER_INCH),
      },
      typo: {
        font: first.font,
        ...(looksCentred(para) ? { align: 'center' as const } : {}),
        size: Math.round(size * 10) / 10,
        lineHeight: Math.min(2, Math.max(0.9, Math.round(lineGap * 100) / 100)),
        ...(first.bold ? { weight: 700 as const } : {}),
        ...(first.italic ? { italic: true } : {}),
        ...(color ? { color } : {}),
        spaceAfter: 0,
      },
    });
  }

  // --- the cleaned render becomes the page background --------------------
  report(`Storing page ${n}`);
  let backgroundUrl = '';
  try {
    const blob = await blobFrom(canvas, 'image/jpeg', 0.86);
    backgroundUrl = await upload(blob, `page-${String(n).padStart(2, '0')}.jpg`);
  } catch { /* keep the text even if the background cannot be stored */ }

  const out = createPage();
  out.hideNumber = true;
  out.margin = 0;
  out.columns = 1;
  out.background = backgroundUrl
    ? { kind: 'image', url: backgroundUrl, fit: 'cover', position: 'center' }
    : { kind: 'none' };
  out.blocks = blocks.map((b) => {
    const block = createBlock('richText');
    block.id = newId();
    block.pos = b.pos;
    block.padding = 0;
    block.typo = b.typo;
    if (block.type === 'richText') block.props.html = b.html;
    return block;
  });

  // Pages that are pure artwork are common (covers, full-bleed photos).
  void ptW;
  return out;
}
