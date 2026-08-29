'use client';

/**
 * Turns a PDF into an editable brochure.
 *
 * A PDF records where ink was placed, not what the author meant by it, so
 * inferring a full block structure is guesswork. Instead each page is split
 * in two:
 *
 *  1. Non-text content (photos, table fills, rules, logos, borders) is kept as
 *     drawn, by rendering the page and using it as the page background.
 *  2. Each run of text becomes an editable block at the coordinates the PDF
 *     gave it. The background under each run is painted out with the color
 *     around it so the original glyphs don't show through after an edit.
 *
 * Nothing here throws. A page that can't be parsed still lands as its own
 * rendered image, so the worst case is a page that isn't editable.
 */

import type { Doc, FontId, Page, Placement, Typo } from '@/lib/types';
import { createBlock, createPage, newId } from '@/lib/doc';
import { DEFAULT_THEME, FONTS } from '@/lib/theme';

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
 * Word's fonts mapped onto the metric-compatible faces this app ships.
 *
 * Order matters: "sans-serif" contains "serif", so the specific names have to
 * come first or a serif rule swallows every sans face on the page.
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

const round3 = (v: number) => Math.round(v * 1000) / 1000;

/**
 * Measures a line in the face it will actually be set in.
 *
 * Tinos and Carlito are metric-compatible with Times and Calibri but not
 * identical, and over a full line the difference can add up to one word too
 * many. Since imported blocks are absolutely positioned, an extra line prints
 * on top of the next block instead of pushing it down.
 */
async function ensureFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const faces: string[] = [];
  for (const { stack } of Object.values(FONTS)) {
    const family = stack.split(',')[0];
    for (const weight of [400, 700]) {
      faces.push(`${weight} 16px ${family}`, `italic ${weight} 16px ${family}`);
    }
  }
  await Promise.all(faces.map((f) => document.fonts.load(f).catch(() => undefined)));
  await document.fonts.ready.catch(() => undefined);
}

function makeMeasurer() {
  const ctx = document.createElement('canvas').getContext('2d');
  return (text: string, font: FontId, sizePt: number, bold: boolean, italic: boolean) => {
    if (!ctx) return 0;
    const px = (sizePt / 72) * 96;
    ctx.font = `${italic ? 'italic ' : ''}${bold ? 700 : 400} ${px}px ${FONTS[font].stack}`;
    return (ctx.measureText(text).width / 96) * 72;   // back into PDF points
  };
}

type Measure = ReturnType<typeof makeMeasurer>;

/** One word, carrying the style it will actually be set in. */
interface Word {
  text: string;
  font: FontId;
  size: number;
  bold: boolean;
  italic: boolean;
}

/** Splits a paragraph into styled words, in reading order. */
function toWords(para: Line[]): Word[] {
  const out: Word[] = [];
  for (const line of para) {
    for (const run of line.runs) {
      for (const text of run.text.split(/\s+/)) {
        if (text) out.push({ text, font: run.font, size: run.h, bold: run.bold, italic: run.italic });
      }
    }
  }
  return out;
}

/**
 * Greedy word wrap, the same rule a browser applies, counted in lines.
 *
 * Each word is measured in its own style. Using the first word's style for the
 * whole paragraph underestimates anything containing bold, by enough to cost a
 * line.
 */
function countLines(words: Word[], widthPt: number, measure: Measure): number {
  if (!words.length) return 0;
  const width = (w: Word) => measure(w.text, w.font, w.size, w.bold, w.italic);
  const spaceFor = (w: Word) => measure(' ', w.font, w.size, w.bold, w.italic);

  let lines = 1;
  let cur = width(words[0]);
  for (let i = 1; i < words.length; i++) {
    const w = width(words[i]);
    const next = cur + spaceFor(words[i]) + w;
    if (next <= widthPt) cur = next;
    else { lines++; cur = w; }
  }
  return lines;
}

/**
 * The width at which a paragraph sets in the same number of lines it had in the
 * PDF.
 *
 * Sizing the box from the PDF's own numbers isn't enough, for the font reasons
 * above, and an extra line overlaps the block below. The wrap is simulated at
 * increasing widths until the line count matches, capped so the box stays
 * inside the page.
 */
function widthForOriginalLines(
  para: Line[], startPt: number, maxPt: number, measure: Measure,
): number {
  const target = para.length;
  if (target < 2 || maxPt <= startPt) return startPt;

  const words = toWords(para);
  for (let w = startPt; w <= maxPt; w += 2) {
    if (countLines(words, w, measure) <= target) return w;
  }
  return maxPt;
}

/**
 * The PostScript name of the face a run was set in, e.g.
 * `BCDGEE+TimesNewRomanPS-BoldMT`.
 *
 * `getTextContent().styles` only reports a generic family ("serif"), which
 * can't distinguish Times from Times Bold, and bold carries a lot of the
 * meaning in these brochures. The real name is on the loaded font object,
 * populated once the page has rendered.
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

/* ------------------------------------------------------------------ columns */

/**
 * Finds the vertical whitespace channels that separate columns.
 *
 * This runs before anything else. A two-column page puts the first line of each
 * column on the same baseline, and joining those interleaves two unrelated
 * paragraphs into one sentence.
 *
 * Splitting on wide horizontal gaps doesn't work here: the column gutter is
 * about 12pt while a tab stop inside a single line reaches 42pt. What does
 * separate them is that a gutter falls in the same place on every line, so the
 * page is scanned for the x fewest runs cross. A few crossings are fine, since
 * page headers legitimately span both columns, so the test is a dip in
 * crossings rather than an empty channel.
 */
interface Column {
  x0: number;
  x1: number;
}

function detectColumns(runs: Run[], pageWidth: number, depth = 0): Column[] {
  const whole: Column[] = [{ x0: 0, x1: pageWidth }];
  if (depth >= 2 || runs.length < 12) return whole;

  const lo = Math.round(pageWidth * 0.2);
  const hi = Math.round(pageWidth * 0.8);
  if (hi <= lo) return whole;

  const counts: number[] = [];
  for (let x = lo; x <= hi; x++) {
    let crossing = 0;
    for (const r of runs) if (r.x < x && r.x + r.w > x) crossing++;
    counts.push(crossing);
  }

  const min = Math.min(...counts);
  const sorted = [...counts].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // A gutter need not be a wide empty channel. Where a column is justified,
  // the cleanest cut can be a single x. What identifies it is that crossings
  // *dip*: a genuinely single-column page crosses evenly all the way across.
  const tolerance = Math.max(2, Math.floor(runs.length * 0.06));
  if (min > tolerance || min > median * 0.5) return whole;

  // Widest stretch sitting at that minimum, so the cut lands mid-gutter.
  let best = { from: lo, to: lo, seen: false };
  let cur: { from: number; to: number } | null = null;
  counts.forEach((n, i) => {
    const x = lo + i;
    if (n === min) { cur = cur ? { from: cur.from, to: x } : { from: x, to: x }; }
    else if (cur) {
      if (!best.seen || cur.to - cur.from > best.to - best.from) best = { ...cur, seen: true };
      cur = null;
    }
  });
  if (cur !== null) {
    const span = cur as { from: number; to: number };
    if (!best.seen || span.to - span.from > best.to - best.from) best = { ...span, seen: true };
  }

  const split = (best.from + best.to) / 2;
  const left = runs.filter((r) => r.x + r.w <= split);
  const right = runs.filter((r) => r.x >= split);
  // A split that leaves one side nearly empty is noise, not a column.
  if (left.length < 5 || right.length < 5) return whole;

  return [
    ...detectColumns(left, split, depth + 1).map((c) => ({ x0: c.x0, x1: Math.min(c.x1, split) })),
    ...detectColumns(right, pageWidth, depth + 1)
      .map((c) => ({ x0: Math.max(c.x0, split), x1: c.x1 })),
  ];
}

/**
 * Splits runs into one bucket per column, plus a bucket for anything that
 * genuinely spans them (page headers, section rules).
 */
function bucketByColumn(runs: Run[], cols: Column[]): { col: Column; runs: Run[]; full?: boolean }[] {
  if (cols.length < 2) return [{ col: cols[0], runs, full: true }];

  const buckets = cols.map((col) => ({ col, runs: [] as Run[] }));
  const spanning: Run[] = [];

  for (const r of runs) {
    const mid = r.x + r.w / 2;
    const owner = buckets.find((b) => mid >= b.col.x0 && mid < b.col.x1);
    if (!owner) { spanning.push(r); continue; }

    // Only a run that reaches well into the next column is really spanning.
    // Justified text routinely overshoots its measure by a point or two, and
    // treating that as full-width strands the last word of a line: the
    // hyphenated half of "recrea-tion" ends up in a block of its own, printed
    // on top of the line below.
    const over = Math.max(owner.col.x0 - r.x, (r.x + r.w) - owner.col.x1);
    if (over > Math.min(20, r.w * 0.35)) spanning.push(r);
    else owner.runs.push(r);
  }

  const full = { x0: cols[0].x0, x1: cols[cols.length - 1].x1 };
  return [...buckets, { col: full, runs: spanning, full: true }].filter((b) => b.runs.length > 0);
}

/**
 * Returns short trailing lines to the full-width paragraph they belong to.
 *
 * A banner spanning both columns is assigned line by line, and its last line is
 * often short enough to sit inside one column, so it gets filed there and
 * renders on top of the sentence it finishes. Anything directly beneath a
 * full-width line, on the same left edge and within a line's pitch, is moved
 * back. The sweep repeats because reclaiming one line can expose the next.
 */
function reclaimFullWidthLines(buckets: { col: Column; lines: Line[]; full?: boolean }[]): void {
  const wide = buckets.find((b) => b.full);
  const columns = buckets.filter((b) => b !== wide);
  if (!wide || !columns.length) return;

  for (let pass = 0; pass < 4; pass++) {
    let moved = false;
    for (const bucket of columns) {
      for (let i = bucket.lines.length - 1; i >= 0; i--) {
        const line = bucket.lines[i];
        const above = wide.lines.find((w) =>
          Math.abs(line.x - w.x) < line.size * 1.2 &&
          line.y - w.y > 0 && line.y - w.y < line.size * 2.1);
        if (!above) continue;
        wide.lines.push(line);
        bucket.lines.splice(i, 1);
        moved = true;
      }
    }
    if (!moved) break;
    wide.lines.sort((a, b) => a.y - b.y || a.x - b.x);
  }
}

/* -------------------------------------------------------------- lines & text */

/**
 * Groups runs that share a baseline into lines, then lines whose left edges and
 * spacing agree into paragraphs. The tolerances are generous: merging two
 * paragraphs is a much smaller annoyance than shredding one into twenty blocks.
 *
 * This only ever runs on a single column's worth of runs, so a wide gap here is
 * a tab stop rather than a gutter and lines are left whole.
 */
function measureLines(runs: Run[]): Line[] {
  const sorted = [...runs].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: Line[] = [];
  for (const r of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(r.y - last.y) <= Math.max(1.6, last.size * 0.34)) {
      last.runs.push(r);
      last.x = Math.min(last.x, r.x);
      last.right = Math.max(last.right, r.x + r.w);
      last.size = Math.max(last.size, r.h);
    } else {
      lines.push({ runs: [r], x: r.x, y: r.y, right: r.x + r.w, size: r.h });
    }
  }
  for (const l of lines) l.runs.sort((a, b) => a.x - b.x);
  return lines;
}

function sameStyle(a: Line, b: Line) {
  const ra = a.runs[0], rb = b.runs[0];
  return ra.font === rb.font && Math.abs(a.size - b.size) < 0.6 && ra.bold === rb.bold;
}

/**
 * True when every line but the last ends on the same right edge, the signature
 * of justified text.
 *
 * Worth detecting because alignment decides where lines break. Re-setting
 * justified copy as left-aligned gives a different number of lines, and since
 * imported blocks are positioned absolutely, an extra line does not push the
 * next block down, it overlaps it.
 */
function looksJustified(lines: Line[]): boolean {
  if (lines.length < 3) return false;
  const size = lines[0].size;

  const full = lines.slice(0, -1).map((l) => l.right);
  const spread = Math.max(...full) - Math.min(...full);
  if (spread > Math.max(2, size * 0.22)) return false;

  // Justified copy ends flush *except* on its last line. A stack of equal-width
  // values, such as a column of phone numbers, is flush on every line including the
  // last, and calling that justified made it look like prose and run all the
  // numbers together on one line.
  const last = lines[lines.length - 1];
  if (last.right > Math.min(...full) - size * 0.5) return false;

  // And it has to be prose: a measure only a few characters wide is a column.
  return Math.min(...full) - Math.min(...lines.map((l) => l.x)) > size * 8;
}

/** True when the lines are centered on a common axis rather than left-aligned. */
function looksCentered(lines: Line[]): boolean {
  if (lines.length < 2) return false;
  const centres = lines.map((l) => (l.x + l.right) / 2);
  const widths = lines.map((l) => l.right - l.x);
  const spreadC = Math.max(...centres) - Math.min(...centres);
  const spreadL = Math.max(...lines.map((l) => l.x)) - Math.min(...lines.map((l) => l.x));
  const spreadW = Math.max(...widths) - Math.min(...widths);
  // Ragged on both edges but steady in the middle.
  return spreadC < lines[0].size * 0.9 && spreadL > lines[0].size && spreadW > lines[0].size;
}

/**
 * Joins consecutive lines into paragraphs. Lines already belong to one column,
 * so the only question left is whether each line continues the one above it.
 */
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
      // Same left edge, or a first-line indent of the same block.
      Math.abs(line.x - prev.x) < Math.max(14, line.size * 1.2);
    if (joins) cur.push(line);
    else paras.push([line]);
  }
  return paras;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Rebuilds a paragraph's HTML, keeping bold and italic runs intact.
 *
 * Two joins have to be judged here, and getting either wrong is visible.
 *
 * Between runs on one line: a PDF records a tab stop as a jump in x, not as any
 * character, so "Special events:" and "Movie Night" arrive as neighbouring runs
 * with nothing between them. A gap wide enough to be deliberate becomes a space.
 *
 * Between lines: prose that wrapped should be joined with a space so it reflows
 * when edited, but a stack of separate values, such as a column of phone
 * numbers, must keep its breaks or it collapses into one long
 * line.
 *
 * Geometry alone cannot tell these apart. A column of phone numbers and a
 * paragraph of ragged-right prose both end their lines short of the measure,
 * and both do it line after line.
 *
 * What does separate them is how the next line begins. Prose that wrapped
 * resumes mid-sentence with a lowercase word, or the far side of a hyphen the
 * typesetter inserted. A new item in a list starts the way any new thing starts:
 * a capital, or a digit. So a line break is kept unless the next line reads as a
 * continuation of the one above.
 *
 * A break is also treated as soft when the next word plainly could not have
 * fitted on the line above. The typesetter had no choice there, whatever the
 * next word happens to start with. That is what keeps a bold sentence like
 * "Rating Session will take place on March 23rd" from being chopped at every
 * capital.
 *
 * Both of those give way to one exception: a stack of lines that all start and
 * end at the same place is a column of values, not a paragraph, and its breaks
 * are always kept. Justified prose also ends flush, so it is excluded by name.
 *
 * A wrapped line ending in a hyphen is usually a word the typesetter broke, so
 * the halves are rejoined and the hyphen dropped: "recrea-" + "tion" should
 * become "recreation", not "recrea- tion", and it has to be one word for the
 * text to re-wrap sensibly after an edit.
 *
 * Table rows defeat the length test on their own, since a row of fee columns is
 * as long as a sentence and reaches just as far across the measure, so a line
 * built out of tab stops is always treated as its own line. Without that, a fee
 * table collapses into one paragraph reading "2 days 9/3-4/26 $295/month RSS
 * MPR 3 days 9/3-4/26 $400/month…".
 */
/** How many gaps in a line are too wide to be word spacing, i.e. tab stops. */
function tabStops(line: Line): number {
  let n = 0;
  for (let i = 1; i < line.runs.length; i++) {
    const gap = line.runs[i].x - (line.runs[i - 1].x + line.runs[i - 1].w);
    if (gap > line.size * 1.2) n++;
  }
  return n;
}

/**
 * Breaks a tabular paragraph into one paragraph per cell, keeping each cell's
 * own x. Non-tabular paragraphs are returned untouched.
 */
function splitCells(para: Line[]): Line[][] {
  if (!para.some((l) => tabStops(l) > 0)) return [para];

  const out: Line[][] = [];
  for (const line of para) {
    let cell: Run[] = [];
    const flush = () => {
      if (!cell.length) return;
      out.push([{
        runs: cell,
        x: cell[0].x,
        y: Math.min(...cell.map((r) => r.y)),
        right: Math.max(...cell.map((r) => r.x + r.w)),
        size: Math.max(...cell.map((r) => r.h)),
      }]);
      cell = [];
    };
    for (const run of line.runs) {
      const prev = cell[cell.length - 1];
      if (prev && run.x - (prev.x + prev.w) > line.size * 1.2) flush();
      cell.push(run);
    }
    flush();
  }
  return out;
}

/**
 * True for a run of lines that all begin and end together: a column of phone
 * numbers or fees, rather than prose. Justified text also ends flush, so it is
 * excluded explicitly.
 */
function isValueStack(lines: Line[]): boolean {
  if (lines.length < 2 || looksJustified(lines)) return false;
  const size = lines[0].size;

  // The decisive test is width. Justified prose is also flush on both edges, and
  // a paragraph whose last line happens to run full, because the sentence
  // carries on into the next block, slips past the justification check. But
  // prose is set across a measure of twenty-odd characters, and a column of
  // phone numbers or fees is a handful. Without this, whole paragraphs came
  // back with a hard break on every line: "Teams will<br>be formed by coaches".
  const measure = Math.max(...lines.map((l) => l.right)) - Math.min(...lines.map((l) => l.x));
  if (measure > size * 14) return false;

  const spread = (ns: number[]) => Math.max(...ns) - Math.min(...ns);
  const tol = size * 0.6;
  return spread(lines.map((l) => l.right)) < tol && spread(lines.map((l) => l.x)) < tol;
}

function paragraphHtml(lines: Line[], measure: Measure): string {
  // How far the type ran: the longest line of this paragraph. Deliberately not
  // the detected column edge. Where no column boundary was found that edge is
  // the whole sheet, and every break then looks like a deliberate one. Lists of
  // equal-width values, the case this would misjudge, are tabular and have
  // already been split into their own cells before reaching here.
  const edge = Math.max(...lines.map((l) => l.right));
  const stack = isValueStack(lines);
  const parts: string[] = [];
  let open = '';

  const setStyle = (want: string) => {
    if (want === open) return;
    if (open.includes('i')) parts.push('</em>');
    if (open.includes('b')) parts.push('</strong>');
    if (want.includes('b')) parts.push('<strong>');
    if (want.includes('i')) parts.push('<em>');
    open = want;
  };

  lines.forEach((line, i) => {
    if (i > 0) {
      const prev = lines[i - 1];
      const text = prev.runs.map((r) => r.text).join('').trim();
      const next = line.runs.map((r) => r.text).join('').trimStart();
      const tabular = tabStops(prev) > 0 || tabStops(line) > 0;
      // A continuation: the sentence carries on, or a word was broken across it.
      const continues = /^[a-z(]/.test(next) || /[a-z,;:-]$/.test(text);
      // Or the next word simply had nowhere to go on the line above.
      const head = line.runs[0];
      const firstWord = next.split(/\s+/)[0] ?? '';
      const needed =
        measure(' ', head.font, head.h, head.bold, head.italic) +
        measure(firstWord, head.font, head.h, head.bold, head.italic);
      const forced = prev.right + needed > edge + 1;

      const wrapped = !tabular && !stack && text.length > 0 && (continues || forced);
      // A lowercase continuation after a hyphen is a broken word, not a compound.
      const softHyphen = wrapped && /[a-z]-$/.test(text) && /^[a-z]/.test(next);
      setStyle('');
      if (softHyphen) {
        // Walk back past any closing tags this line emitted; the hyphen lives on
        // the last piece of real text, and stripping a tag instead silently
        // welded two words together ("lemonade-and").
        for (let k = parts.length - 1; k >= 0; k--) {
          if (parts[k].startsWith('<')) continue;
          parts[k] = parts[k].replace(/-$/, '');
          break;
        }
      } else {
        parts.push(wrapped ? ' ' : '<br>');
      }
    }
    line.runs.forEach((run, j) => {
      if (j > 0) {
        const prev = line.runs[j - 1];
        const gap = run.x - (prev.x + prev.w);
        // Wide enough to be a tab stop, and no space already carried in the text.
        if (gap > run.h * 0.28 && !/\s$/.test(prev.text) && !/^\s/.test(run.text)) {
          setStyle('');
          parts.push(' ');
        }
      }
      setStyle(`${run.bold ? 'b' : ''}${run.italic ? 'i' : ''}`);
      parts.push(esc(run.text));
    });
  });
  setStyle('');

  const body = parts.join('').replace(/[ \t]{2,}/g, ' ').replace(/^\s+|\s+$/g, '');
  return body ? `<p>${body}</p>` : '';
}

/**
 * The color of the ground behind a run of text, and how confident we are that
 * the ground is a flat color at all.
 *
 * Sampled from a thin ring just *outside* the text box rather than from the box
 * itself. The ring is background by construction, since no glyphs of this
 * paragraph reach it, so the winning color is the ground even for dense bold text, where
 * ink can cover enough of the box interior to beat the paper.
 *
 * The share of the ring taken by that one color is the useful signal: on paper
 * or a solid panel it is nearly all of it, while over a photograph or a gradient
 * no single color comes close. That is the difference between safely painting
 * the old glyphs out and stamping a visible rectangle across someone's artwork.
 */
function groundColor(
  data: Uint8ClampedArray, cw: number, ch: number,
  x0: number, y0: number, x1: number, y1: number,
): { rgb: [number, number, number]; fraction: number } {
  const counts = new Map<number, number>();
  let total = 0;

  const sample = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= cw || y >= ch) return;
    const i = (y * cw + x) * 4;
    // Quantize so anti-aliasing and JPEG noise collapse onto one ground color.
    const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    total++;
  };

  const pad = 3;
  const stepX = Math.max(1, Math.floor((x1 - x0) / 60));
  const stepY = Math.max(1, Math.floor((y1 - y0) / 24));
  for (let x = x0 - pad; x <= x1 + pad; x += stepX) {
    for (let d = 1; d <= pad; d++) { sample(x, y0 - d); sample(x, y1 + d); }
  }
  for (let y = y0 - pad; y <= y1 + pad; y += stepY) {
    for (let d = 1; d <= pad; d++) { sample(x0 - d, y); sample(x1 + d, y); }
  }

  let best = 0, bestN = -1;
  for (const [k, n] of counts) if (n > bestN) { bestN = n; best = k; }
  if (bestN < 0) return { rgb: [255, 255, 255], fraction: 0 };

  const rgb: [number, number, number] = [
    ((best >> 10) & 31) << 3, ((best >> 5) & 31) << 3, (best & 31) << 3,
  ];

  // Count everything close to the winner, not only exact matches. A panel with
  // a soft gradient or a rounded border is still a flat enough ground to paint
  // on, but its pixels scatter across neighbouring buckets and an exact count
  // reads it as busy, which left the header row of every schedule table stuck
  // in the background image instead of becoming editable text.
  let near = 0;
  for (const [k, n] of counts) {
    const dr = (((k >> 10) & 31) << 3) - rgb[0];
    const dg = (((k >> 5) & 31) << 3) - rgb[1];
    const db = ((k & 31) << 3) - rgb[2];
    if (dr * dr + dg * dg + db * db <= 1200) near += n;
  }

  // The quantization above floors each channel, so paper sampled at 255 comes
  // back as 248 and the patch reads as a faint grey box. Snap it back to white.
  for (let c = 0; c < 3; c++) if (rgb[c] >= 240) rgb[c] = 255;

  return { rgb, fraction: total ? near / total : 0 };
}

/** Darkest pixel in a box. For text on a lighter ground, that is the ink. */
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
  // Too close to the background to be a deliberate color, so leave it inherited.
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

  // Webfonts load lazily, and a face that has not loaded measures as a fallback
  // which would defeat the point of measuring. Ask for them up front.
  await ensureFonts();

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

/**
 * Where a block would run into the one below it, closes its leading just enough
 * to fit.
 *
 * Substituting Tinos for Times is faithful to a fraction of a point, and over a
 * paragraph those fractions occasionally add a line. Because these blocks are
 * positioned absolutely, that line does not push its neighbour down, it prints
 * on top of it. Three percent tighter leading is not something anyone will
 * notice; two paragraphs printed over each other is the first thing they will.
 *
 * The adjustment is deliberately small and floored: where a block is far too
 * tall the cause is something else, and squashing it would only hide that.
 */
function tightenColliding(blocks: { pos: Placement; typo: Typo; lines: number }[]): void {
  const order = [...blocks].sort((a, b) => a.pos.y - b.pos.y);

  for (let i = 0; i < order.length; i++) {
    const a = order[i];
    const size = (a.typo.size ?? 10) / PT_PER_INCH;
    const lead = a.typo.lineHeight ?? 1.15;
    const height = a.lines * size * lead;

    let room = Infinity;
    for (let j = i + 1; j < order.length; j++) {
      const b = order[j];
      const overlapX =
        Math.min(a.pos.x + a.pos.w, b.pos.x + b.pos.w) - Math.max(a.pos.x, b.pos.x);
      if (overlapX > 0.1 && b.pos.y > a.pos.y) room = Math.min(room, b.pos.y - a.pos.y);
    }
    if (!Number.isFinite(room) || height <= room) continue;

    const needed = room / (a.lines * size);
    if (needed >= lead * 0.9 && needed >= 0.92) {
      a.typo.lineHeight = Math.round(needed * 100) / 100;
    }
  }
}

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
  } catch { /* no text layer; the page still lands as its background */ }

  // Columns first, then lines and paragraphs inside each one. Doing it in this
  // order is what stops two columns being welded into one sentence.
  const columns = detectColumns(runs, ptW);
  const buckets = bucketByColumn(runs, columns)
    .map((b) => ({ col: b.col, full: b.full, lines: measureLines(b.runs) }));
  reclaimFullWidthLines(buckets);
  const groups = buckets.map((b) => ({ col: b.col, paragraphs: toParagraphs(b.lines) }));

  // --- sample colors, then paint the original glyphs out ----------------
  report(`Cleaning page ${n}`);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const measure = makeMeasurer();
  const clampX = (v: number) => Math.max(0, Math.min(canvas.width - 1, Math.round(v)));
  const clampY = (v: number) => Math.max(0, Math.min(canvas.height - 1, Math.round(v)));

  const blocks: { html: string; pos: Placement; typo: Typo; lines: number }[] = [];

  for (const { col, paragraphs } of groups) {
  // A paragraph whose lines are built from tab stops is a table. Emitting it as
  // one text block would replace aligned columns with single spaces, and a fee
  // table would stop lining up, so each cell becomes its own placed block, at
  // the x the PDF gave it. The columns stay aligned and every figure stays
  // editable, which is exactly the part of a brochure that changes each season.
  for (const para of paragraphs.flatMap(splitCells)) {
    const html = paragraphHtml(para, measure);
    if (!html) continue;

    const x = Math.min(...para.map((l) => l.x));
    const right = Math.max(...para.map((l) => l.right));
    const size = Math.max(...para.map((l) => l.size));
    const top = para[0].y;
    const bottom = para[para.length - 1].y + size;

    // `top` is already a full em above the baseline, which clears the tallest
    // ascender, so almost no headroom is needed. Padding it further reached into
    // the line above and erased the top half of it, which is what clipped the
    // header row off every schedule table.
    const bx0 = clampX((x - 1) * scale);
    const by0 = clampY((top - size * 0.03) * scale);
    const bx1 = clampX((right + 1) * scale);
    const by1 = clampY((bottom + size * 0.26) * scale);   // descenders only
    if (bx1 <= bx0 || by1 <= by0) continue;

    const ground = groundColor(pixels, canvas.width, canvas.height, bx0, by0, bx1, by1);

    // Painting the old glyphs out only works where the ground behind them is a
    // flat color. Over a photograph or a gradient the fill would be a visible
    // rectangle of the wrong shade, so that text is left as part of the
    // background image instead. It stops being editable, but nothing is
    // damaged, which is the better trade for artwork.
    // Measured across these brochures the ring is 0.91 flat at the median and
    // above 0.77 for nine paragraphs in ten; what falls below sits on photos.
    if (ground.fraction < 0.65) continue;

    // Sampled from the glyph band only. Reaching into the padding can pick up
    // the line above, which is how tan text ended up rendered black.
    const color = inkColor(
      pixels, canvas.width,
      bx0, clampY(top * scale), bx1, clampY((bottom - size * 0.12) * scale),
      ground.rgb,
    );

    ctx.fillStyle = `rgb(${ground.rgb[0]},${ground.rgb[1]},${ground.rgb[2]})`;
    ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);

    const lineGap = para.length > 1 ? (para[1].y - para[0].y) / size : 1.15;
    const first = para[0].runs[0];

    const setWidthPt = para.length > 1
      ? Math.max(col.x1, right + 3,
          x + widthForOriginalLines(para, Math.max(col.x1, right + 3) - x,
            Math.min(ptW - 6, col.x1 + (col.x1 - col.x0) * 0.25) - x, measure)) - x
      : Math.min(right + size * 0.6, col.x1) - x;

    blocks.push({
      // Explicit breaks set their own lines on top of whatever the text wraps
      // to, so they have to be counted or the height estimate runs short.
      lines: Math.max(
        para.length,
        countLines(toWords(para), setWidthPt, measure) + (html.match(/<br>/g)?.length ?? 0),
      ),
      html,
      pos: {
        // Rounded to thousandths of an inch, finer than any printer resolves,
        // and it keeps the inspector's number fields readable.
        x: round3(x / PT_PER_INCH),
        y: round3((top - size * 0.24) / PT_PER_INCH),
        // A wrapped paragraph is given at least the width its text actually
        // reached, and at least its column. Never less: the detected column edge
        // sits at the ragged right of the copy, so it can fall a few points
        // *inside* the true measure, and a box that narrow re-wraps the text one
        // line longer than the original. Since these blocks are positioned
        // absolutely, that extra line does not push the next block down, it
        // lands on top of it. A single line only needs the width it occupies.
        w: round3(Math.max(0.25, setWidthPt) / PT_PER_INCH),
      },
      typo: {
        font: first.font,
        ...(looksCentered(para) ? { align: 'center' as const }
          : looksJustified(para) ? { align: 'justify' as const } : {}),
        size: Math.round(size * 10) / 10,
        lineHeight: Math.min(2, Math.max(0.9, Math.round(lineGap * 100) / 100)),
        ...(first.bold ? { weight: 700 as const } : {}),
        ...(first.italic ? { italic: true } : {}),
        ...(color ? { color } : {}),
        spaceAfter: 0,
      },
    });
  }
  }

  // --- keep neighbours from colliding ------------------------------------
  tightenColliding(blocks);

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
