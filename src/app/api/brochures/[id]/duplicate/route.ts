import { NextResponse } from 'next/server';
import { store } from '@/lib/db';
import { cloneDoc } from '@/lib/doc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** "Next season" in one click: same layout, fresh ids, new name. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title } = await req.json().catch(() => ({ title: undefined }));
  const src = await store().get(id);
  if (!src) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const name = (title as string | undefined)?.trim() || `${src.title} (copy)`;
  const rec = await store().create(name, cloneDoc(src.doc, name));
  return NextResponse.json({ brochure: rec }, { status: 201 });
}
