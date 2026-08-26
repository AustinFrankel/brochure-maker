import { newId } from '../doc';
import type {
  Align, Block, Color, Fill, HighlightBoxProps, Page, TableData, Typo,
} from '../types';

export const F = (color: string): Fill => ({ kind: 'color', color });
export const NONE: Fill = { kind: 'none' };

const base = (col: 0 | 1 = 0) => ({
  id: newId(), span: 'column' as const, col, background: NONE, typo: {} as Typo, padding: 0,
});

/** Full-width centered section heading (the cyan underlined bar). */
export function sec(html: string, typo: Typo = {}): Block {
  return {
    ...base(), span: 'full',
    typo: { size: 18, weight: 700, align: 'center', underline: true, color: '@cyan', spaceAfter: 4, ...typo },
    type: 'sectionTitle', props: { html },
  };
}

export function txt(html: string, o: { col?: 0 | 1; full?: boolean; typo?: Typo; bg?: Fill; padding?: number } = {}): Block {
  return {
    ...base(o.col ?? 0),
    span: o.full ? 'full' : 'column',
    typo: o.typo ?? {},
    background: o.bg ?? NONE,
    padding: o.padding ?? 0,
    type: 'richText', props: { html },
  };
}

const DEFAULT_COLS = [2.2, 1.5, 0.9, 1.7];

export function tbl(
  head: string[],
  rows: string[][],
  o: {
    cols?: number[]; fill?: string; border?: number; borderColor?: Color;
    size?: number; headFill?: string;
  } = {},
): TableData {
  const f = F(o.fill ?? '@cyan');
  return {
    head,
    rows,
    cols: o.cols ?? DEFAULT_COLS.slice(0, head.length || rows[0]?.length || 4),
    headFill: o.headFill ? F(o.headFill) : f,
    bodyFill: f,
    borderColor: o.borderColor ?? '@black',
    borderWidth: o.border ?? 2,
    ...(o.size ? { fontSize: o.size } : {}),
  };
}

/** The workhorse: purple heading, description, cyan schedule box, Who lines, note. */
export function prog(o: {
  heading: string;
  body?: string;
  table?: TableData | null;
  meta?: [string, string][];
  note?: string;
  col?: 0 | 1;
  headingColor?: Color;
  metaLabelWidth?: number;
  typo?: Typo;
}): Block {
  return {
    ...base(o.col ?? 0),
    typo: o.typo ?? {},
    type: 'program',
    props: {
      heading: o.heading,
      body: o.body ?? '',
      table: o.table ?? null,
      meta: (o.meta ?? []).map(([label, value]) => ({ label, value })),
      note: o.note ?? '',
      headingColor: o.headingColor ?? '@purple',
      noteColor: '@violet',
      metaLabelWidth: o.metaLabelWidth ?? 62,
    },
  };
}

export function table(t: TableData, o: { col?: 0 | 1; full?: boolean } = {}): Block {
  return { ...base(o.col ?? 0), span: o.full ? 'full' : 'column', type: 'infoTable', props: t };
}

export function photo(url: string, o: {
  col?: 0 | 1; width?: 'column' | 'full' | 'bleed'; height?: number | null;
  caption?: string; fit?: 'cover' | 'contain'; border?: number; radius?: number; typo?: Typo;
} = {}): Block {
  return {
    ...base(o.col ?? 0),
    span: o.width === 'full' || o.width === 'bleed' ? 'full' : 'column',
    typo: o.typo ?? {},
    type: 'photo',
    props: {
      url, alt: '', width: o.width ?? 'column', height: o.height ?? null,
      fit: o.fit ?? 'cover', focal: 'center', caption: o.caption ?? '',
      borderColor: '@black', borderWidth: o.border ?? 0, radius: o.radius ?? 0,
    },
  };
}

export function hl(html: string, o: {
  col?: 0 | 1; full?: boolean; fill?: string; size?: number; align?: Align;
  padding?: number; border?: number; borderColor?: Color; typo?: Typo;
} & Partial<HighlightBoxProps> = {}): Block {
  return {
    ...base(o.col ?? 0),
    span: o.full === false ? 'column' : 'full',
    background: F(o.fill ?? '@pink'),
    padding: o.padding ?? 12,
    typo: { size: o.size ?? 26, weight: 700, align: o.align ?? 'center', ...o.typo },
    type: 'highlightBox',
    props: {
      html, padding: 0, borderColor: o.borderColor ?? '@black', borderWidth: o.border ?? 0,
      ...(o.leftImage ? { leftImage: o.leftImage } : {}),
      ...(o.rightImage ? { rightImage: o.rightImage } : {}),
      ...(o.sideImageWidth ? { sideImageWidth: o.sideImageWidth } : {}),
    },
  };
}

export function lv(rows: [string, string][], o: {
  col?: 0 | 1; labelWidth?: number; valueColor?: Color; valueBold?: boolean; typo?: Typo;
} = {}): Block {
  return {
    ...base(o.col ?? 0),
    typo: o.typo ?? {},
    type: 'labelValue',
    props: {
      rows: rows.map(([label, value]) => ({ label, value })),
      labelWidth: o.labelWidth ?? 62,
      labelBold: true,
      valueBold: o.valueBold ?? true,
      valueColor: o.valueColor ?? '@black',
    },
  };
}

export function qr(data: string, o: { col?: 0 | 1; caption?: string; size?: number } = {}): Block {
  return {
    ...base(o.col ?? 0),
    typo: { align: 'center' },
    type: 'qr',
    props: { data, caption: o.caption ?? 'Scan me!', size: o.size ?? 2.1, imageUrl: '' },
  };
}

export function gap(height: number, o: { col?: 0 | 1 } = {}): Block {
  return { ...base(o.col ?? 0), type: 'spacer', props: { height } };
}

export function page(blocks: Block[], o: Partial<Omit<Page, 'id' | 'blocks'>> = {}): Page {
  return { id: newId(), background: NONE, frame: null, ...o, blocks };
}

/** "Checks payable to Rye Brook Recreation." — appears on nearly every program. */
export const CHECKS = 'Checks payable to Rye Brook Recreation.';
export const CHECKS_MAKE = 'Make Checks payable to Rye Brook Recreation';

/** The pink registration callout that repeats on pages 4, 6, 8, 9. It sits in
 *  one column, not across the page. */
export const REG_CALLOUT = (col: 0 | 1 = 0) =>
  hl('<p>Online Registration<br>Begins<br>September 3rd<br>@ 9:30pm</p>',
     { col, full: false, size: 17, padding: 6 });
