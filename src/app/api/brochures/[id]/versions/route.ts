import { NextResponse } from 'next/server';
import { store } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return NextResponse.json({ versions: await store().versions(id) });
}

/** Restore a snapshot. The current state is snapshotted first, so restore itself
 *  is undoable. */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { versionId } = await req.json().catch(() => ({}));
  const s = store();
  const doc = await s.version(id, versionId);
  if (!doc) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  await s.snapshot(id, 'before restore');
  await s.update(id, { doc, title: doc.title });
  return NextResponse.json({ ok: true, doc });
}
