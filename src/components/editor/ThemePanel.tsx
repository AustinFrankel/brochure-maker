'use client';

import type { Doc } from '@/lib/types';
import { PALETTE_LABELS } from '@/lib/theme';
import { useEditor } from '@/lib/store';
import { Field, FontPicker, Num } from './fields/controls';

/**
 * Document-wide settings. Changing the palette here restyles every block that
 * uses a colour token, so one tap can recolour all fourteen pages.
 */
export function ThemePanel({ doc }: { doc: Doc }) {
  const setTheme = useEditor((s) => s.setTheme);
  const setPalette = useEditor((s) => s.setPalette);
  const setPageSetup = useEditor((s) => s.setPageSetup);

  return (
    <div className="insp" style={{ paddingTop: 14 }}>
      <div className="insp-kind" style={{ marginBottom: 10 }}>Whole brochure</div>

      <FontPicker label="Body font" value={doc.theme.baseFont} onChange={(baseFont) => baseFont && setTheme({ baseFont })} />
      <div className="fld-row">
        <Num label="Body size" value={doc.theme.baseSize} min={6} max={24} step={0.5} suffix="pt"
          onChange={(baseSize) => setTheme({ baseSize })} />
        <Num label="Line height" value={doc.theme.baseLineHeight} min={0.9} max={2.2} step={0.02}
          onChange={(baseLineHeight) => setTheme({ baseLineHeight })} />
      </div>

      <Field label="Colours">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(Object.keys(PALETTE_LABELS) as (keyof typeof PALETTE_LABELS)[]).map((token) => (
            <label key={token} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: 0 }}>
              <input
                type="color" className="swatch" style={{ flex: 'none', padding: 2 }}
                value={doc.theme.palette[token]}
                onChange={(e) => setPalette(token, e.target.value)}
              />
              <span style={{ flex: 1 }}>{PALETTE_LABELS[token]}</span>
              <code style={{ fontSize: 11.5, color: 'var(--ui-muted)' }}>{doc.theme.palette[token]}</code>
            </label>
          ))}
        </div>
      </Field>

      <details className="sect" open>
        <summary>Default page setup</summary>
        <div className="fld-row">
          <Num label="Margin" value={doc.pageSetup.margin} min={0} max={2.5} step={0.05} suffix="in"
            onChange={(margin) => setPageSetup({ margin })} />
          <Num label="Gutter" value={doc.pageSetup.gutter} min={0} max={1.5} step={0.02} suffix="in"
            onChange={(gutter) => setPageSetup({ gutter })} />
        </div>
        <Num label="First page number" value={doc.pageSetup.numberFrom} min={0} max={999}
          onChange={(numberFrom) => setPageSetup({ numberFrom })} />
        <div style={{ fontSize: 12, color: 'var(--ui-muted)', lineHeight: 1.4 }}>
          Individual pages can override the margin and column count from the page panel.
        </div>
      </details>
    </div>
  );
}
