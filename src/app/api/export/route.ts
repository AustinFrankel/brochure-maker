import { NextResponse } from 'next/server';
import { store } from '@/lib/db';
import { launchBrowser } from '@/lib/browser';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Filesystem-safe version of the brochure title. */
function filename(title: string) {
  const base = title.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '') || 'brochure';
  return `${base}.pdf`;
}

/**
 * Renders `/print/[id]` in headless Chromium and returns a real, vector PDF.
 *
 * It loads the same components and the same stylesheet the editor uses, so the
 * download matches the canvas exactly — there is no second layout engine to
 * drift. If this route ever fails, the editor's "Print / Save as PDF" button
 * does the same thing through the user's own browser.
 */
export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const rec = await store().get(id);
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const origin = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : new URL(req.url).origin;

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.emulateMediaType('print');
    await page.goto(`${origin}/print/${id}`, { waitUntil: 'networkidle0', timeout: 45_000 });

    // The print page flips this once webfonts are ready and every image decoded.
    await page.waitForSelector('[data-print-ready="true"]', { timeout: 30_000 });

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      format: 'letter',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    // Every export is a restore point.
    await store().snapshot(id, 'exported');

    return new NextResponse(Buffer.from(pdf) as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename(rec.title)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  } finally {
    await browser?.close().catch(() => {});
  }
}
