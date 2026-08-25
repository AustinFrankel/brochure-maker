'use client';

import { useEffect, useRef } from 'react';
import type { Block, Doc, Page } from '@/lib/types';
import { fillToStyle, inch, LETTER, pageGeometry, resolveColor, themeVars } from '@/lib/theme';
import { BlockView } from './BlockView';

/**
 * A page is a vertical stack of *bands*.
 *
 * A `span: 'full'` block is its own full-width band. Runs of `span: 'column'`
 * blocks group into a two-column band, and each block states which column it
 * belongs to. Explicit columns beat CSS auto-flow here: the editor needs "this
 * program on the left, that one on the right" to stay put while surrounding
 * text grows and shrinks.
 */
export type Band =
  | { kind: 'full'; block: Block; start: number }
  | { kind: 'cols'; cols: [Block[], Block[]]; start: number };

export function toBands(blocks: Block[], columns: 1 | 2): Band[] {
  const bands: Band[] = [];
  let run: Block[] | null = null;
  let runStart = 0;

  const flush = () => {
    if (!run || run.length === 0) { run = null; return; }
    if (columns === 1) {
      bands.push({ kind: 'cols', cols: [run, []], start: runStart });
    } else {
      const left = run.filter((b) => (b.col ?? 0) === 0);
      const right = run.filter((b) => (b.col ?? 0) === 1);
      bands.push({ kind: 'cols', cols: [left, right], start: runStart });
    }
    run = null;
  };

  blocks.forEach((b, i) => {
    if (b.span === 'full') { flush(); bands.push({ kind: 'full', block: b, start: i }); }
    else { if (!run) { run = []; runStart = i; } run.push(b); }
  });
  flush();
  return bands;
}

export function PageSurface({
  doc, page, index, children, onOverflow, renderBlock, className, style,
}: {
  doc: Doc;
  page: Page;
  index: number;
  children?: React.ReactNode;
  onOverflow?: (overflowing: boolean) => void;
  /** The editor swaps in a wrapper that adds selection and drag affordances. */
  renderBlock?: (block: Block) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { margin, columns, gutter } = pageGeometry(doc, page);
  const contentRef = useRef<HTMLDivElement>(null);
  const bands = toBands(page.blocks, columns);
  const ratio = page.colRatio ?? [1, 1];

  // Pages are a fixed size, so anything past the margin box is silently clipped
  // in the PDF. Watch for it so the editor can warn instead of shipping a
  // brochure with a missing paragraph.
  useEffect(() => {
    if (!onOverflow) return;
    const el = contentRef.current;
    if (!el) return;
    const check = () => onOverflow(el.scrollHeight - el.clientHeight > 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    for (const child of Array.from(el.querySelectorAll('.rb-band, .rb-block'))) ro.observe(child);
    const imgs = Array.from(el.querySelectorAll('img'));
    imgs.forEach((i) => i.addEventListener('load', check));
    return () => {
      ro.disconnect();
      imgs.forEach((i) => i.removeEventListener('load', check));
    };
  }, [onOverflow, page, doc.theme, doc.pageSetup]);

  const draw = renderBlock ?? ((b: Block) => <BlockView key={b.id} block={b} theme={doc.theme} />);
  const frame = page.frame;

  return (
    <div
      className={`rb-page${className ? ` ${className}` : ''}`}
      data-page-id={page.id}
      data-page-index={index}
      style={{
        // The theme variables live on the page itself, so a page carries its own
        // typography no matter who renders it — the editor canvas, the rail
        // thumbnails, or the PDF. Putting them on a parent made it possible to
        // forget one, and the canvas then silently inherited the app's own font.
        ...themeVars(doc.theme),
        width: inch(LETTER.width),
        height: inch(LETTER.height),
        ['--rb-margin' as string]: inch(margin),
        ...fillToStyle(page.background, doc.theme),
        ...style,
      }}
    >
      {frame && (
        <div
          className="rb-frame"
          style={{
            inset: inch(frame.inset),
            border: `${frame.width}px solid ${resolveColor(frame.color, doc.theme) ?? '#000'}`,
          }}
        />
      )}

      <div ref={contentRef} className="rb-content" style={{ padding: inch(margin) }}>
        {bands.map((band, bi) =>
          band.kind === 'full' ? (
            <div className="rb-band rb-band-full" key={`f${band.block.id}`}>
              {draw(band.block)}
            </div>
          ) : (
            <div className="rb-band rb-band-cols" key={`c${bi}-${band.start}`} style={{ gap: inch(gutter) }}>
              <div className="rb-col" data-col="0" data-band={bi} style={{ flex: ratio[0] }}>
                {band.cols[0].map(draw)}
              </div>
              {columns === 2 && (
                <div className="rb-col" data-col="1" data-band={bi} style={{ flex: ratio[1] }}>
                  {band.cols[1].map(draw)}
                </div>
              )}
            </div>
          ),
        )}
      </div>

      {!page.hideNumber && (
        <div className="rb-pagenum" style={{ bottom: inch(margin * 0.42) }}>
          {doc.pageSetup.numberFrom + index}
        </div>
      )}

      {children}
    </div>
  );
}
