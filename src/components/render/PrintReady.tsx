'use client';

import { useEffect } from 'react';

/**
 * Flags the page as safe to capture. The exporter waits for this instead of a
 * fixed delay, so a slow photo can never land half-loaded in the PDF.
 */
export function PrintReady({ autoPrint }: { autoPrint?: boolean }) {
  useEffect(() => {
    let cancelled = false;
    const images = Array.from(document.images);

    const settled = images.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          }),
    );

    Promise.all([document.fonts.ready, ...settled]).then(async () => {
      if (cancelled) return;
      // One more frame so the final layout has been painted.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;
      document.documentElement.setAttribute('data-print-ready', 'true');
      if (autoPrint) window.print();
    });

    return () => { cancelled = true; };
  }, [autoPrint]);

  return null;
}
