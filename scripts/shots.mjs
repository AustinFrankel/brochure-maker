/**
 * Renders every page of a brochure to PNG at 150dpi and, when the matching
 * page of the original PDF is available, reports a pixel-difference score.
 *
 *   node scripts/shots.mjs <brochureId> [outDir]
 */
import { existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const [, , id, outDir = '.shots'] = process.argv;
const PORT = process.env.PORT ?? 3000;
const REF = process.env.REF_DIR ?? `${process.env.HOME}/Downloads/ilovepdf_pages-to-jpg`;

const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean).find((p) => existsSync(p));

if (!CHROME) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(1); }
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--font-render-hinting=none', '--force-device-scale-factor=1'],
  defaultViewport: { width: 816, height: 1056, deviceScaleFactor: 150 / 96 },
});
const page = await browser.newPage();
await page.emulateMediaType('print');
await page.goto(`http://localhost:${PORT}/print/${id}`, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForSelector('[data-print-ready="true"]', { timeout: 60000 });

const count = await page.$$eval('.rb-page', (els) => els.length);
console.log(`${count} pages\n`);

const rows = [];
for (let i = 0; i < count; i++) {
  const el = (await page.$$('.rb-page'))[i];
  const file = `${outDir}/page-${String(i + 1).padStart(2, '0')}.png`;
  await el.screenshot({ path: file });

  const ref = `${REF}/2025-Fall-Brochure-2_page-${String(i + 1).padStart(4, '0')}.jpg`;
  let score = null;
  if (existsSync(ref)) {
    try {
      const out = execFileSync('magick', [
        'compare', '-metric', 'RMSE',
        '(', file, '-resize', '1275x1650!', '-colorspace', 'sRGB', ')',
        '(', ref, '-resize', '1275x1650!', '-colorspace', 'sRGB', ')',
        'null:',
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
      score = out.toString();
    } catch (e) {
      score = (e.stderr?.toString() ?? '').trim();
    }
  }
  const pct = score?.match(/\(([\d.]+)\)/)?.[1];
  rows.push({ page: i + 1, similarity: pct ? `${(100 - Number(pct) * 100).toFixed(1)}%` : 'n/a' });
  console.log(`page ${String(i + 1).padStart(2)}  ${pct ? `${(100 - Number(pct) * 100).toFixed(1)}% match` : 'rendered'}`);
}

await browser.close();
console.log(`\nPNGs in ${outDir}/`);
