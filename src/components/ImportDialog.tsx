'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Doc } from '@/lib/types';
import { uploadBlob } from '@/lib/upload';

type Phase =
  | { kind: 'idle' }
  | { kind: 'working'; label: string; done: number; total: number }
  | { kind: 'error'; message: string };

/**
 * Brings a file into the app.
 *
 * A `.json` file is one of this app's own exports and loads directly. A `.pdf`
 * is converted: the pages are rendered and the text lifted off into editable
 * blocks. Conversion happens in this browser rather than on the server, because
 * a 50-page PDF is far too much work for a serverless function and the browser
 * already has everything needed to do it.
 */
export function ImportDialog({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const create = useCallback(async (doc: Doc, title: string) => {
    const res = await fetch('/api/brochures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc, title }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Could not save the brochure.');
    onDone?.();
    router.push(`/edit/${data.brochure.id}`);
  }, [router, onDone]);

  const handle = useCallback(async (file: File) => {
    try {
      if (/\.json$/i.test(file.name) || file.type === 'application/json') {
        setPhase({ kind: 'working', label: 'Reading the file', done: 0, total: 1 });
        const doc = JSON.parse(await file.text()) as Doc;
        if (!doc || !Array.isArray(doc.pages)) throw new Error('That file is not a brochure export.');
        await create(doc, doc.title ?? file.name.replace(/\.json$/i, ''));
        return;
      }

      setPhase({ kind: 'working', label: 'Opening the PDF', done: 0, total: 1 });
      const { importPdf } = await import('@/lib/import/pdf');
      const doc = await importPdf(file, {
        upload: (blob, name) => uploadBlob(blob, name, 'pages'),
        onProgress: ({ page, total, stage }) =>
          setPhase({ kind: 'working', label: stage, done: page, total: Math.max(total, 1) }),
      });
      setPhase({ kind: 'working', label: 'Saving', done: 1, total: 1 });
      await create(doc, doc.title);
    } catch (e) {
      setPhase({ kind: 'error', message: (e as Error).message || 'That file could not be read.' });
    }
  }, [create]);

  const pick = () => {
    setPhase({ kind: 'idle' });
    inputRef.current?.click();
  };

  return (
    <>
      <button className="btn" onClick={pick} disabled={phase.kind === 'working'}>
        Import PDF
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf,application/json,.json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';        // let the same file be picked twice
          if (f) void handle(f);
        }}
      />

      {phase.kind === 'working' && (
        <>
          <div className="pop-scrim" />
          <div className="progress-card" role="status" aria-live="polite">
            <b>Converting your PDF</b>
            <p>
              Each page is rendered and its text lifted off into blocks you can retype.
              Longer documents take a moment.
            </p>
            <div className="bar">
              <span style={{ width: `${Math.round((phase.done / phase.total) * 100)}%` }} />
            </div>
            <span className="progress-note">
              {phase.label}
              {phase.total > 1 && `, ${phase.done} of ${phase.total}`}
            </span>
          </div>
        </>
      )}

      {phase.kind === 'error' && (
        <>
          <div className="pop-scrim" onClick={() => setPhase({ kind: 'idle' })} />
          <div className="progress-card" role="alert">
            <b>That file could not be imported</b>
            <p>{phase.message}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" onClick={pick}>Try another file</button>
              <button className="btn" onClick={() => setPhase({ kind: 'idle' })}>Close</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
