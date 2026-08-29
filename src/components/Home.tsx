'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { BrochureMeta, Doc } from '@/lib/types';
import { PageSurface } from '@/components/render/PageSurface';
import { ImportDialog } from '@/components/ImportDialog';
import type { TemplateInfo } from '@/lib/templates';

const THUMB_SCALE = 210 / 816;

function Preview({ doc }: { doc: Doc | null }) {
  if (!doc?.pages?.length) return <div className="card-blank">No preview</div>;
  return (
    <div className="thumb-scale" style={{ transform: `scale(${THUMB_SCALE})`, width: 816, height: 1056 }}>
      <PageSurface doc={doc} page={doc.pages[0]} index={0} />
    </div>
  );
}

export function Home({ brochures, covers, templates, templateCovers, localMode }: {
  brochures: BrochureMeta[];
  covers: Record<string, Doc>;
  templates: TemplateInfo[];
  templateCovers: Record<string, Doc>;
  localMode: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async (url: string, body?: unknown) => {
    setBusy(url); setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong.');
      if (data.brochure?.id) router.push(`/edit/${data.brochure.id}`);
      else start(() => router.refresh());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (b: BrochureMeta) => {
    if (!confirm(`Move “${b.title}” to the bin? Its version history is kept.`)) return;
    setBusy(b.id);
    await fetch(`/api/brochures/${b.id}`, { method: 'DELETE' });
    setBusy(null);
    start(() => router.refresh());
  };

  return (
    <div className="home">
      <header className="home-head">
        <div>
          <h1>Brochures</h1>
          <p className="home-sub">
            Rye Brook Parks &amp; Recreation. Start from a past season, or bring in a PDF.
          </p>
        </div>
        <ImportDialog onDone={() => setPicking(false)} />
        <button className="btn btn-primary" disabled={!!busy} onClick={() => setPicking(true)}>
          New brochure
        </button>
      </header>

      {localMode && (
        <div className="notice">
          Running without cloud storage. Brochures are saved to <code>.data/brochures.json</code> on
          this machine only. Set the Supabase environment variables to sync across devices.
        </div>
      )}
      {error && <div className="notice notice-bad">{error}</div>}

      {picking && (
        <>
          <div className="pop-scrim" onClick={() => setPicking(false)} />
          <div className="picker" role="dialog" aria-label="Start a new brochure">
            <div className="picker-head">
              <b>Start from</b>
              <button className="btn btn-sm btn-quiet" onClick={() => setPicking(false)}>Close</button>
            </div>
            <div className="picker-grid">
              {templates.map((t) => (
                <button
                  key={t.id}
                  className="tcard"
                  disabled={!!busy}
                  onClick={() => post('/api/brochures', { template: t.id, title: `${t.name} brochure` })}
                >
                  <span className="tcard-preview">
                    <Preview doc={templateCovers[t.id] ?? null} />
                  </span>
                  <span className="tcard-meta">
                    <b>{t.name}</b>
                    <span>{t.blurb}</span>
                    <em>{t.pages} page{t.pages === 1 ? '' : 's'}</em>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {brochures.length === 0 ? (
        <p className="home-sub" style={{ padding: '28px 0' }}>
          No brochures yet.
        </p>
      ) : (
        <div className="cards">
          {brochures.map((b) => (
            <div className="card" key={b.id}>
              <Link className="card-preview" href={`/edit/${b.id}`}>
                <Preview doc={covers[b.id] ?? null} />
              </Link>
              <div className="card-meta">
                <b>{b.title}</b>
                <span>
                  {b.pageCount} page{b.pageCount === 1 ? '' : 's'} · edited{' '}
                  {new Date(b.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="card-actions">
                <Link className="btn btn-sm" href={`/edit/${b.id}`}>Edit</Link>
                <button className="btn btn-sm" disabled={!!busy}
                  onClick={() => post(`/api/brochures/${b.id}/duplicate`, { title: `${b.title} (copy)` })}>
                  Duplicate
                </button>
                <a className="btn btn-sm" href={`/print/${b.id}`} target="_blank" rel="noreferrer">View</a>
                <button className="btn btn-sm btn-danger" disabled={!!busy} onClick={() => remove(b)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {pending && <p className="home-sub" style={{ marginTop: 16 }}>Refreshing…</p>}
    </div>
  );
}
