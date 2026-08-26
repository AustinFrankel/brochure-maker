import { NextResponse } from 'next/server';
import { store } from '@/lib/db';
import { migrate } from '@/lib/doc';
import { buildTemplate } from '@/lib/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ brochures: await store().list() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title: string = body.title?.trim() || 'Untitled brochure';

  // Two ways in: an already-built document (a .json export, or a freshly
  // imported PDF), or one of the bundled templates.
  const doc = body.doc ? migrate(body.doc) : buildTemplate(body.template ?? 'fall-2025', title);

  const rec = await store().create(title, { ...doc, title });
  return NextResponse.json({ brochure: rec }, { status: 201 });
}
