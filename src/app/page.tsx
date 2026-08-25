import { store, usingLocalStore } from '@/lib/db';
import { Home } from '@/components/Home';
import type { Doc } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const s = store();
  const brochures = await s.list();

  // Cover thumbnails: only the first page of each is needed, but the store keeps
  // whole documents, so fetch and trim.
  const covers: Record<string, Doc> = {};
  await Promise.all(brochures.slice(0, 24).map(async (b) => {
    const rec = await s.get(b.id);
    if (rec) covers[b.id] = { ...rec.doc, pages: rec.doc.pages.slice(0, 1) };
  }));

  return <Home brochures={brochures} covers={covers} localMode={usingLocalStore()} />;
}
