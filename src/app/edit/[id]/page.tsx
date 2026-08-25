import { notFound } from 'next/navigation';
import { store } from '@/lib/db';
import { Editor } from '@/components/editor/Editor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = await store().get(id);
  if (!rec) notFound();
  return <Editor initial={rec} />;
}
