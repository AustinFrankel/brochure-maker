'use client';

import { useEffect, useRef } from 'react';
import type { Doc } from './types';
import { useEditor } from './store';

/** Fetch caps `keepalive` request bodies at 64KB, and a full brochure is larger
 *  than that. Anything bigger has to go as an ordinary request. */
const KEEPALIVE_LIMIT = 60_000;

/**
 * Autosave: debounced so typing produces about one write per second, with a
 * version snapshot every twentieth save. Anything still unsaved is flushed when
 * the tab is hidden, so closing it mid-sentence doesn't lose the sentence.
 */
export function useAutosave(id: string, doc: Doc, enabled: boolean) {
  const setSaveState = useEditor((s) => s.setSaveState);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSaved = useRef('');
  const pending = useRef('');
  const saveCount = useRef(0);
  const inFlight = useRef(false);

  // Held in a ref so the page-hide listener never captures a stale closure.
  const save = useRef(async (body: string, snapshot: boolean) => {
    if (inFlight.current || body === lastSaved.current) return;
    inFlight.current = true;
    setSaveState('saving');
    try {
      const res = await fetch(`/api/brochures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: snapshot ? JSON.stringify({ ...JSON.parse(body), snapshot: 'autosave' }) : body,
        keepalive: body.length < KEEPALIVE_LIMIT,
      });
      if (!res.ok) throw new Error(String(res.status));
      lastSaved.current = body;
      setSaveState('saved');
    } catch {
      setSaveState('error');
    } finally {
      inFlight.current = false;
      // A change that landed while this request was in flight still needs saving.
      if (pending.current !== lastSaved.current && pending.current !== body) {
        const next = pending.current;
        setTimeout(() => void save.current(next, false), 300);
      }
    }
  });

  useEffect(() => {
    if (!enabled) return;
    const body = JSON.stringify({ doc, title: doc.title });
    pending.current = body;
    if (body === lastSaved.current) return;

    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveCount.current += 1;
      void save.current(body, saveCount.current % 20 === 0);
    }, 900);

    return () => clearTimeout(timer.current);
  }, [doc, enabled, id]);

  // Don't lose the last keystroke when the tab closes or the phone locks.
  useEffect(() => {
    if (!enabled) return;
    const onHide = () => {
      if (document.visibilityState === 'visible') return;
      clearTimeout(timer.current);
      inFlight.current = false;
      void save.current(pending.current, false);
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [enabled]);
}
