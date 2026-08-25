import { notFound } from 'next/navigation';
import { store } from '@/lib/db';
import { DocRenderer } from '@/components/render/DocRenderer';
import { PrintReady } from '@/components/render/PrintReady';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Chrome-free render of every page. Headless Chromium screenshots this for the
 * "Download PDF" button, and the browser's own print dialog renders the exact
 * same markup for "Print / Save as PDF".
 */
export default async function PrintPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const rec = await store().get(id);
  if (!rec) notFound();

  return (
    <main className="rb-print-root">
      <DocRenderer doc={rec.doc} />
      <PrintReady autoPrint={print === '1'} />
    </main>
  );
}
