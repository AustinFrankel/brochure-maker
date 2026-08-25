'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BrochureMeta, Doc } from '@/lib/types';
import { useEditor } from '@/lib/store';
import { useAutosave } from '@/lib/useAutosave';
import { TopBar } from './TopBar';
import { PageRail } from './PageRail';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';

export function Editor({ initial }: { initial: BrochureMeta & { doc: Doc } }) {
  const doc = useEditor((s) => s.doc);
  const load = useEditor((s) => s.load);
  const saveState = useEditor((s) => s.saveState);
  const selectPage = useEditor((s) => s.selectPage);
  const selectBlock = useEditor((s) => s.selectBlock);
  const [zoom, setZoom] = useState(0.9);
  const canvasRef = useRef<HTMLDivElement>(null);

  // The store starts empty and is filled on mount; a matching id means the
  // document in hand is the one this page was rendered for.
  const ready = useEditor((s) => s.loadedId) === initial.id;

  useEffect(() => {
    load(initial.id, initial.doc);
    useEditor.temporal.getState().clear();
  }, [initial.id, initial.doc, load]);

  useAutosave(initial.id, doc, ready);

  // Fit the page to the viewport on first paint and whenever the window resizes.
  useEffect(() => {
    const fit = () => {
      const el = canvasRef.current;
      if (!el) return;
      const avail = el.clientWidth - 40;
      setZoom(Math.min(1.25, Math.max(0.28, avail / 816)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [ready]);

  const jump = useCallback((i: number) => {
    selectPage(i);
    selectBlock(null);
    canvasRef.current?.querySelectorAll('.page-wrap')[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectPage, selectBlock]);

  // Undo/redo from the keyboard, but never while typing into a form control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) useEditor.temporal.getState().redo();
        else useEditor.temporal.getState().undo();
      }
      if (e.key === 'Escape') selectBlock(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectBlock]);

  if (!ready) return <div className="insp-empty" style={{ padding: 40 }}>Opening…</div>;

  return (
    <div className="ed">
      <TopBar id={initial.id} doc={doc} saveState={saveState} zoom={zoom} setZoom={setZoom} onJump={jump} />
      <div className="ed-body">
        <div className="ed-rail">
          <PageRail doc={doc} onJump={jump} />
        </div>
        <div className="ed-canvas" ref={canvasRef}>
          <Canvas doc={doc} zoom={zoom} />
        </div>
        <div className="ed-panel">
          <Inspector doc={doc} />
        </div>
      </div>
    </div>
  );
}
