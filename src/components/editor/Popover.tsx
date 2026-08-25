'use client';

import { useEffect } from 'react';

/**
 * One overlay primitive that becomes a popover on a large screen and a bottom
 * sheet on a phone. Keeps the editor to a single interaction model rather than
 * two parallel UIs.
 */
export function Overlay({ open, onClose, anchor, width, children, title }: {
  open: boolean | undefined;
  onClose: () => void;
  /** Element to hang the popover off on wide screens. */
  anchor?: HTMLElement | null;
  
  width?: number;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const narrow = typeof window !== 'undefined' && window.innerWidth <= 900;

  if (narrow) {
    return (
      <>
        <div className="pop-scrim" onClick={onClose} />
        <div className="sheet" role="dialog" aria-label={title}>
          <div className="sheet-grip" onClick={onClose}><span /></div>
          <div className="sheet-body">{children}</div>
        </div>
      </>
    );
  }

  const r = anchor?.getBoundingClientRect();
  const w = width ?? 300;
  const left = r ? Math.min(Math.max(8, r.left), window.innerWidth - w - 8) : 40;
  const top = r ? Math.min(r.bottom + 6, window.innerHeight - 60) : 60;

  return (
    <>
      <div className="pop-scrim" style={{ background: 'transparent' }} onClick={onClose} />
      <div className="pop" role="dialog" aria-label={title} style={{ left, top, width: w }}>
        {children}
      </div>
    </>
  );
}
