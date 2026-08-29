'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Doc } from '@/lib/types';
import { useEditor, useTemporal, type SaveState } from '@/lib/store';
import { migrate } from '@/lib/doc';
import { Overlay } from './Popover';
import { ThemePanel } from './ThemePanel';
import { Inspector } from './Inspector';
import { PageRail } from './PageRail';

const STATUS: Record<SaveState, string> = {
  idle: '', saving: 'Saving…', saved: 'Saved', error: 'Not saved, retrying',
};

function ExportMenu({ id, doc, onClose, anchor, open }: {
  id: string; doc: Doc; open: boolean; anchor: HTMLElement | null | undefined; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '-') || 'brochure'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, '-') || 'brochure'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Overlay open={open} onClose={onClose} anchor={anchor} width={290} title="Export">
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-primary" disabled={busy} onClick={download}>
          {busy ? 'Building PDF…' : 'Download PDF'}
        </button>
        <button className="btn" onClick={() => { window.open(`/print/${id}?print=1`, '_blank'); onClose(); }}>
          Print / Save as PDF
        </button>
        <div style={{ fontSize: 12, color: 'var(--ui-muted)', lineHeight: 1.4 }}>
          Both give the same fourteen Letter pages. Printing goes through your own browser, so it
          works even if the server is busy. On iPad, choose <b>Save to Files</b>.
        </div>
        <hr style={{ border: 0, borderTop: '1px solid var(--ui-line)', margin: '2px 0' }} />
        <button className="btn btn-sm" onClick={exportJson}>Save a .json backup</button>
        {error && <div style={{ color: 'var(--ui-danger)', fontSize: 12.5, lineHeight: 1.4 }}>{error}</div>}
      </div>
    </Overlay>
  );
}

/** Five controls and nothing else: Pages, Undo, Redo, Theme, Export. */
export function TopBar({ id, doc, saveState, zoom, setZoom, onJump }: {
  id: string;
  doc: Doc;
  saveState: SaveState;
  zoom: number;
  setZoom: (z: number) => void;
  onJump: (i: number) => void;
}) {
  const setTitle = useEditor((s) => s.setTitle);
  const { undo, redo, canUndo, canRedo } = useTemporal();

  // The popover hangs off whichever button opened it. That element is captured
  // in the click handler. Reading a ref during render would not re-render the
  // popover once the ref filled in.
  const [menu, setMenu] = useState<{ id: 'pages' | 'theme' | 'export' | 'edit'; anchor: HTMLElement } | null>(null);
  const open = (id: 'pages' | 'theme' | 'export' | 'edit') => (e: React.MouseEvent<HTMLButtonElement>) =>
    setMenu({ id, anchor: e.currentTarget });
  const close = () => setMenu(null);

  return (
    <div className="ed-bar">
      <Link href="/" className="btn btn-quiet btn-icon" title="All brochures" aria-label="All brochures">←</Link>

      <input
        className="ed-title" value={doc.title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Brochure name"
      />

      <span className="ed-status">{STATUS[saveState]}</span>

      <button className="btn btn-sm only-narrow" onClick={open('pages')}>Pages</button>

      <button className="btn btn-sm btn-icon" disabled={!canUndo} onClick={undo} title="Undo" aria-label="Undo">↺</button>
      <button className="btn btn-sm btn-icon" disabled={!canRedo} onClick={redo} title="Redo" aria-label="Redo">↻</button>

      <span className="only-wide" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button className="btn btn-sm btn-icon" onClick={() => setZoom(Math.max(0.35, Math.round((zoom - 0.1) * 100) / 100))} title="Zoom out" aria-label="Zoom out">−</button>
        <span style={{ fontSize: 12, color: 'var(--ui-muted)', width: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button className="btn btn-sm btn-icon" onClick={() => setZoom(Math.min(2, Math.round((zoom + 0.1) * 100) / 100))} title="Zoom in" aria-label="Zoom in">+</button>
      </span>

      <button className="btn btn-sm only-narrow" onClick={open('edit')}>Edit</button>
      <button className="btn btn-sm" onClick={open('theme')}>Theme</button>
      <button className="btn btn-sm btn-primary" onClick={open('export')}>Export</button>

      <Overlay open={menu?.id === 'pages'} anchor={menu?.anchor} onClose={close} width={190} title="Pages">
        <div style={{ padding: 10 }}>
          <PageRail doc={doc} onJump={(i) => { onJump(i); close(); }} />
        </div>
      </Overlay>

      <Overlay open={menu?.id === 'edit'} anchor={menu?.anchor} onClose={close} width={330} title="Edit">
        <Inspector doc={doc} />
      </Overlay>

      <Overlay open={menu?.id === 'theme'} anchor={menu?.anchor} onClose={close} width={330} title="Theme">
        <ThemePanel doc={doc} />
      </Overlay>

      <ExportMenu id={id} doc={doc} open={menu?.id === 'export'} anchor={menu?.anchor} onClose={close} />
    </div>
  );
}

export { migrate };
