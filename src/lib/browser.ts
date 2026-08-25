import 'server-only';
import type { Browser } from 'puppeteer-core';

/**
 * Launch headless Chromium for PDF rendering.
 *
 * On Vercel this pulls the compressed Sparticuz build (the full binary does not
 * fit comfortably in a function bundle). Locally it reuses whatever Chrome is
 * already installed, so `npm run dev` needs no extra download.
 */
const LOCAL_CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean) as string[];

const PACK_URL =
  process.env.CHROMIUM_PACK_URL ??
  'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar';

export async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default;

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium-min')).default;
    return puppeteer.launch({
      args: [...chromium.args, '--font-render-hinting=none'],
      defaultViewport: { width: 816, height: 1056, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(PACK_URL),
      headless: true,
    }) as unknown as Promise<Browser>;
  }

  const { existsSync } = await import('node:fs');
  const executablePath = LOCAL_CHROME.find((p) => existsSync(p));
  if (!executablePath) {
    throw new Error(
      'No local Chrome found for PDF export. Install Google Chrome, or set CHROME_PATH. ' +
      'The "Print / Save as PDF" button works without it.',
    );
  }
  return puppeteer.launch({
    executablePath,
    args: ['--font-render-hinting=none', '--no-sandbox'],
    defaultViewport: { width: 816, height: 1056, deviceScaleFactor: 1 },
    headless: true,
  }) as unknown as Promise<Browser>;
}
