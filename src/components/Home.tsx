'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { BrochureMeta, Doc } from '@/lib/types';
import { PageSurface } from '@/components/render/PageSurface';

const THUMB_SCALE = 190 / 816;

function Preview({ doc }: { doc: Doc | null }) {
  if (!doc?.pages?.length) return null;
  return (
    <div className="thumb-scale" style={{ transform: `scale(${THUMB_SCALE})`, width: 816, height: 1056 }}>
      <PageSurface doc={doc} page={doc.pages[0]} index={0} />
    </div>
  );
}

export function Home({ brochures, covers, localMode }: {
  brochures: BrochureMeta[];
  covers: Record<string, Doc>;
  localMode: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const post = async (url: string, body?: unknown) => {
    setBusy(url);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      if (data.brochure?.id) router.push(`/edit/${data.brochure.id}`);
      else start(() => router.refresh());
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const importJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const doc = JSON.parse(await file.text());
        await post('/api/brochures', { doc, title: doc.title ?? file.name.replace(/\.json$/, '') });
      } catch {
        alert('That file is not a brochure export.');
      }
    };
    input.click();
  };

  const remove = async (b: BrochureMeta) => {
    if (!confirm(`Move “${b.title}” to the bin? You can restore it from its version history.`)) return;
    setBusy(b.id);
    await fetch(`/api/brochures/${b.id}`, { method: 'DELETE' });
    setBusy(null);
    start(() => router.refresh());
  };

  return (
    <div className="home">
      <div className="home-head">
        <h1>Brochures</h1>
        <button className="btn" onClick={importJson}>Import .json</button>
        <button className="btn" disabled={!!busy} onClick={() => post('/api/brochures', { template: 'blank', title: 'Untitled brochure' })}>
          Blank
        </button>
        <button className="btn btn-primary" disabled={!!busy} onClick={() => post('/api/brochures', { title: 'New brochure' })}>
          New from template
        </button>
      </div>

      {localMode && (
        <div className="notice">
          Running without a database — brochures are saved to <code>.data/brochures.json</code> in the
          project folder. Set <code>DATABASE_URL</code> to store them in Postgres.
        </div>
      )}

      {brochures.length === 0 ? (
        <div className="insp-empty" style={{ padding: '40px 0' }}>
          Nothing here yet. <b>New from template</b> starts you off with the full Fall 2025 brochure —
          change the dates and fees, then export.
        </div>
      ) : (
        <div className="cards">
          {brochures.map((b) => (
            <div className="card" key={b.id}>
              <a className="card-preview" href={`/edit/${b.id}`}>
                <Preview doc={covers[b.id] ?? null} />
              </a>
              <div className="card-meta">
                <b>{b.title}</b>
                <span>
                  {b.pageCount} page{b.pageCount === 1 ? '' : 's'} · {new Date(b.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="card-actions">
                <a className="btn btn-sm" href={`/edit/${b.id}`}>Edit</a>
                <button className="btn btn-sm" disabled={!!busy}
                  onClick={() => post(`/api/brochures/${b.id}/duplicate`, { title: `${b.title} (copy)` })}>
                  Duplicate
                </button>
                <a className="btn btn-sm" href={`/print/${b.id}`} target="_blank" rel="noreferrer">View</a>
                <button className="btn btn-sm btn-danger" disabled={!!busy} onClick={() => remove(b)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {pending && <div style={{ marginTop: 16, color: 'var(--ui-muted)', fontSize: 13 }}>Refreshing…</div>}
    </div>
  );
}
