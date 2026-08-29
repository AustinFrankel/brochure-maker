/**
 * Objective layout check for a rendered brochure: which pages overflow their
 * sheet, and which table cells wrap to more than one line.
 *
 *   node scripts/audit.mjs <brochureId>
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const id = process.argv[2];
const PORT = process.env.PORT ?? 3000;
const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find((p) => existsSync(p));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--font-render-hinting=none'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1100 });
await page.emulateMediaType('print');
await page.goto(`http://localhost:${PORT}/print/${id}`, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForSelector('[data-print-ready="true"]', { timeout: 60000 });

const report = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.rb-page').forEach((pg, i) => {
    const content = pg.querySelector('.rb-content');
    // `.rb-content` clips, which makes scrollHeight unreliable here: Chrome
    // clamps it to clientHeight. Measure the last band against the inner edge
    // of the padding box instead.
    let overflow = 0;
    if (content) {
      const cs = getComputedStyle(content);
      const box = content.getBoundingClientRect();
      const innerBottom = box.bottom - parseFloat(cs.paddingBottom);
      const last = content.lastElementChild;
      if (last) overflow = last.getBoundingClientRect().bottom - innerBottom;
    }
    // Placed blocks are absolutely positioned, so text that re-wraps longer
    // than the original lands on the block below instead of pushing it down.
    // Overlap is therefore the honest measure of import fidelity.
    const placed = [...pg.querySelectorAll('.rb-placed')].map((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    let overlaps = 0;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i], b = placed[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > 8 && oy > 6) overlaps++;
      }
    }

    const wrapped = [];
    pg.querySelectorAll('td, th').forEach((cell) => {
      const lh = parseFloat(getComputedStyle(cell).lineHeight) || 13;
      const lines = Math.round(cell.getBoundingClientRect().height / lh);
      if (lines > 1 && cell.textContent.trim()) {
        wrapped.push(`${lines}L "${cell.textContent.trim().slice(0, 28)}"`);
      }
    });
    out.push({ page: i + 1, overflowPx: Math.max(0, Math.round(overflow)), wrapped, overlaps });
  });
  return out;
});

let bad = 0;
let overlapping = 0;
for (const r of report) {
  const flags = [];
  if (r.overflowPx > 2) { flags.push(`OVERFLOW +${r.overflowPx}px`); bad++; }
  if (r.overlaps) { flags.push(`${r.overlaps} overlapping block(s)`); overlapping += r.overlaps; }
  if (r.wrapped.length) flags.push(`${r.wrapped.length} wrapped cell(s): ${r.wrapped.slice(0, 4).join(', ')}`);
  console.log(`page ${String(r.page).padStart(2)}  ${flags.length ? flags.join('  |  ') : 'clean'}`);
}
console.log(`\n${bad} page(s) overflow the sheet, ${overlapping} overlapping block pair(s).`);
await browser.close();
