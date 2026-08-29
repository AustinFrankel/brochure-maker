'use client';

import type { Doc } from '@/lib/types';
import { PageSurface } from './PageSurface';

/** Chrome-free render of every page. This is what `/print/[id]` serves. */
export function DocRenderer({ doc }: { doc: Doc }) {
  return (
    <div className="rb-doc">
      {doc.pages.map((p, i) => (
        <PageSurface key={p.id} doc={doc} page={p} index={i} />
      ))}
    </div>
  );
}
