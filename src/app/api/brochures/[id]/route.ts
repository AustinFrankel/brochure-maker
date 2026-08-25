import { NextResponse } from 'next/server';
import { store } from '@/lib/db';
import { migrate } from '@/lib/doc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const rec = await store().get(id);
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ brochure: rec });
}

/** Autosave target. Debounced by the editor to roughly one call per second. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const s = store();
  const patch: { title?: string; doc?: ReturnType<typeof migrate> } = {};
  if (typeof body.title === 'string') patch.title = body.title;
  if (body.doc) {
    patch.doc = migrate(body.doc);
    patch.title = patch.title ?? patch.doc.title;
  }

  // Keep a restore point every so often. Nothing here is ever hard-deleted.
  if (body.snapshot) await s.snapshot(id, typeof body.snapshot === 'string' ? body.snapshot : 'autosave');

  await s.update(id, patch);
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const s = store();
  await s.snapshot(id, 'before delete');
  await s.softDelete(id);
  return NextResponse.json({ ok: true });
}
