/**
 * Runs a PDF through the app's own importer and saves the resulting document as
 * a bundled template.
 *
 * The import deliberately runs in a real browser rather than in Node: that is
 * where it runs for users, so this exercises the exact same code path.
 *
 *   node scripts/make-template.mjs <pdf-path> <template-slug> "<Title>"
 */
import { existsSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const [, , pdfPath, slug, title] = process.argv;
const PORT = process.env.PORT ?? 3000;
const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find((p) => existsSync(p));

if (!pdfPath || !slug) {
  console.error('usage: node scripts/make-template.mjs <pdf> <slug> "<Title>"');
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--font-render-hinting=none', '--no-sandbox'],
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('  [page]', m.text().slice(0, 160)); });
page.on('pageerror', (e) => console.log('  [pageerror]', String(e).slice(0, 200)));

await page.setViewport({ width: 1280, height: 900 });
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0', timeout: 60000 });

const input = await page.waitForSelector('input[type=file]', { timeout: 20000 });
console.log(`importing ${pdfPath} …`);
await input.uploadFile(pdfPath);

// Progress is reported in the card; mirror it so a long import is not silent.
let lastNote = '';
const ticker = setInterval(async () => {
  const note = await page.evaluate(() =>
    document.querySelector('.progress-note')?.textContent ?? '').catch(() => '');
  if (note && note !== lastNote) { lastNote = note; console.log('  ', note); }
}, 1200);

await page.waitForFunction(() => /\/edit\//.test(location.pathname), { timeout: 600000, polling: 500 });
clearInterval(ticker);

const id = new URL(page.url()).pathname.split('/').pop();
const res = await fetch(`http://localhost:${PORT}/api/brochures/${id}`);
const { brochure } = await res.json();

const doc = { ...brochure.doc, title: title ?? brochure.title };
const out = `src/lib/templates/data/${slug}.json`;
writeFileSync(out, JSON.stringify(doc));

const blocks = doc.pages.reduce((n, p) => n + p.blocks.length, 0);
console.log(`\n${out}`);
console.log(`  ${doc.pages.length} pages, ${blocks} editable text blocks`);
console.log(`  preview: http://localhost:${PORT}/print/${id}`);

await browser.close();
