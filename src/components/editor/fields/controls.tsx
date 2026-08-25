'use client';

import { useId } from 'react';
import type { Align, Fill, FontId, Theme } from '@/lib/types';
import { FONT_IDS, FONTS, PALETTE_LABELS } from '@/lib/theme';

export function Field({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="fld">
      {label && <div className="fld-label">{label}</div>}
      {children}
    </div>
  );
}

export function Text({ label, value, onChange, placeholder, multiline, rows }: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; rows?: number;
}) {
  return (
    <Field label={label}>
      {multiline
        ? <textarea value={value} rows={rows ?? 3} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );
}

export function Num({ label, value, onChange, min, max, step, suffix }: {
  label?: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; suffix?: string;
}) {
  const bump = (d: number) => {
    const next = Math.round((value + d) * 100) / 100;
    onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next)));
  };
  const s = step ?? 1;
  return (
    <Field label={label}>
      <div className="fld-row">
        <button type="button" className="btn btn-sm btn-icon" onClick={() => bump(-s)} aria-label="Decrease">−</button>
        <input
          type="number" value={Number.isFinite(value) ? value : ''} min={min} max={max} step={s}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          style={{ textAlign: 'center' }}
        />
        <button type="button" className="btn btn-sm btn-icon" onClick={() => bump(s)} aria-label="Increase">+</button>
        {suffix && <span style={{ fontSize: 12, color: 'var(--ui-muted)' }}>{suffix}</span>}
      </div>
    </Field>
  );
}

export function Seg<T extends string | number>({ label, value, options, onChange }: {
  label?: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <div className="seg">
        {options.map((o) => (
          <button key={String(o.value)} type="button" data-active={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="fld fld-row" style={{ gap: 8 }}>
      <input id={id} type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, minHeight: 18, flex: 'none' }} />
      <label htmlFor={id} style={{ fontSize: 13, margin: 0 }}>{label}</label>
    </div>
  );
}

/**
 * The one-tap colour picker: the six brand colours, plus white, "none" and a
 * custom well. Used for text colour, fills, borders — everywhere colour appears.
 */
export function Swatches({ label, value, onChange, theme, allowNone, noneLabel }: {
  label?: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  theme: Theme;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const tokens = Object.keys(PALETTE_LABELS) as (keyof typeof PALETTE_LABELS)[];
  const custom = value && !value.startsWith('@') ? value : '#000000';
  return (
    <Field label={label}>
      <div className="swatches">
        {allowNone && (
          <button
            type="button" className="swatch swatch-none" data-active={value === undefined}
            title={noneLabel ?? 'None'} onClick={() => onChange(undefined)}
          />
        )}
        {tokens.map((t) => (
          <button
            key={t} type="button" className="swatch"
            style={{ background: theme.palette[t] }}
            data-active={value === `@${t}`}
            title={PALETTE_LABELS[t]}
            onClick={() => onChange(`@${t}`)}
          />
        ))}
        <input
          type="color" className="swatch" value={custom} title="Custom colour"
          style={{ padding: 2 }}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}

export function FillPicker({ label, value, onChange, theme, onPickImage }: {
  label?: string; value: Fill; onChange: (f: Fill) => void; theme: Theme;
  onPickImage?: () => void;
}) {
  return (
    <>
      <Swatches
        label={label}
        theme={theme}
        allowNone
        noneLabel="No background"
        value={value.kind === 'color' ? value.color : undefined}
        onChange={(c) => onChange(c === undefined ? { kind: 'none' } : { kind: 'color', color: c })}
      />
      {onPickImage && (
        <div className="fld-row" style={{ marginTop: -6, marginBottom: 12 }}>
          <button type="button" className="btn btn-sm" onClick={onPickImage}>
            {value.kind === 'image' ? 'Replace image…' : 'Use an image…'}
          </button>
          {value.kind === 'image' && (
            <button type="button" className="btn btn-sm btn-danger" onClick={() => onChange({ kind: 'none' })}>Remove</button>
          )}
        </div>
      )}
    </>
  );
}

export function FontPicker({ label, value, onChange, allowInherit }: {
  label?: string; value: FontId | undefined; onChange: (v: FontId | undefined) => void; allowInherit?: boolean;
}) {
  return (
    <Field label={label}>
      <select value={value ?? ''} onChange={(e) => onChange((e.target.value || undefined) as FontId | undefined)}>
        {allowInherit && <option value="">Same as document</option>}
        {FONT_IDS.map((f) => <option key={f} value={f}>{FONTS[f].label}</option>)}
      </select>
    </Field>
  );
}

export const ALIGNS: { value: Align; label: string }[] = [
  { value: 'left', label: '↤' },
  { value: 'center', label: '↔' },
  { value: 'right', label: '↦' },
  { value: 'justify', label: '≡' },
];

/** A list of repeating rows with add / delete, used for table rows, Who lines,
 *  directory entries and staff groups. */
export function RowList<T>({ label, items, onChange, render, blank, addLabel, max }: {
  label?: string;
  items: T[];
  onChange: (next: T[]) => void;
  render: (item: T, set: (v: T) => void, i: number) => React.ReactNode;
  blank: () => T;
  addLabel?: string;
  max?: number;
}) {
  return (
    <Field label={label}>
      <div className="rows">
        {items.map((item, i) => (
          <div className="row-item" key={i}>
            {render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}
            <button
              type="button" className="row-del" aria-label="Remove row"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >×</button>
          </div>
        ))}
      </div>
      {(max == null || items.length < max) && (
        <button type="button" className="btn btn-sm" style={{ marginTop: 6 }} onClick={() => onChange([...items, blank()])}>
          + {addLabel ?? 'Add row'}
        </button>
      )}
    </Field>
  );
}
