import { store, usingLocalStore } from '@/lib/db';
import { Home } from '@/components/Home';
import { TEMPLATES, templateCover } from '@/lib/templates';
import type { Doc } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const s = store();
  const brochures = await s.list().catch(() => []);

  // Only the first page of each is drawn, but the store keeps whole documents.
  const covers: Record<string, Doc> = {};
  await Promise.all(brochures.slice(0, 24).map(async (b) => {
    const rec = await s.get(b.id).catch(() => null);
    if (rec) covers[b.id] = { ...rec.doc, pages: rec.doc.pages.slice(0, 1) };
  }));

  const templateCovers: Record<string, Doc> = {};
  for (const t of TEMPLATES) {
    const cover = templateCover(t.id);
    if (cover) templateCovers[t.id] = cover;
  }

  return (
    <Home
      brochures={brochures}
      covers={covers}
      templates={TEMPLATES}
      templateCovers={templateCovers}
      localMode={usingLocalStore()}
    />
  );
}
