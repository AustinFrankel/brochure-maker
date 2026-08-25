import { NextResponse } from 'next/server';
import { store } from '@/lib/db';
import { cloneDoc, emptyDoc, migrate } from '@/lib/doc';
import { fall2025 } from '@/lib/seed/fall-2025';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ brochures: await store().list() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title: string = body.title?.trim() || 'Untitled brochure';

  // Three ways in: from the bundled template, from an imported .json, or blank.
  const doc =
    body.doc ? migrate(body.doc)
    : body.template === 'blank' ? emptyDoc(title)
    : cloneDoc(fall2025(), title);

  const rec = await store().create(title, { ...doc, title });
  return NextResponse.json({ brochure: rec }, { status: 201 });
}
