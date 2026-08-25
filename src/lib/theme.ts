import type { Color, Doc, Fill, FontId, Theme, Typo } from './types';

/** The Rye Brook palette, sampled from the Fall 2025 PDF. */
export const DEFAULT_PALETTE = {
  cyan:   '#00AEEF',
  purple: '#A349A4',
  violet: '#CC66CC',
  pink:   '#FFCCFF',
  red:    '#CC0000',
  black:  '#000000',
  white:  '#FFFFFF',
} as const;

export const PALETTE_LABELS: Record<keyof typeof DEFAULT_PALETTE, string> = {
  cyan: 'Cyan', purple: 'Purple', violet: 'Violet',
  pink: 'Pink', red: 'Red', black: 'Black', white: 'White',
};

export const FONTS: Record<FontId, { label: string; stack: string; note: string }> = {
  tinos:         { label: 'Times',    stack: `'Tinos','Times New Roman',Times,serif`,       note: 'Matches Times New Roman exactly' },
  carlito:       { label: 'Calibri',  stack: `'Carlito',Calibri,'Segoe UI',sans-serif`,      note: 'Matches Calibri exactly' },
  arimo:         { label: 'Arial',    stack: `'Arimo',Arial,Helvetica,sans-serif`,           note: 'Matches Arial exactly' },
  'eb-garamond': { label: 'Garamond', stack: `'EB Garamond',Garamond,serif`,                 note: 'Classic book serif' },
  cinzel:        { label: 'Engraved', stack: `'Cinzel',Castellar,'Trajan Pro',serif`,        note: 'All-caps display face' },
  georgia:       { label: 'Georgia',  stack: `Georgia,'Times New Roman',serif`,              note: 'Sturdy screen serif' },
};

export const FONT_IDS = Object.keys(FONTS) as FontId[];

export const DEFAULT_THEME: Theme = {
  baseFont: 'tinos',
  // Measured off the Fall 2025 PDF: 10pt Times with a 22px/150dpi line pitch.
  baseSize: 10,
  baseLineHeight: 1.06,
  palette: { ...DEFAULT_PALETTE },
};

/** Resolve `"@cyan"` against the theme; pass literals (`"#abc"`) straight through. */
export function resolveColor(color: Color | undefined, theme: Theme): string | undefined {
  if (!color) return undefined;
  if (color.startsWith('@')) return theme.palette[color.slice(1) as keyof typeof DEFAULT_PALETTE] ?? color;
  return color;
}

export function fillToStyle(fill: Fill | undefined, theme: Theme): React.CSSProperties {
  if (!fill || fill.kind === 'none') return {};
  if (fill.kind === 'color') return { background: resolveColor(fill.color, theme) };
  return {
    backgroundImage: `url(${fill.url})`,
    backgroundSize: fill.fit,
    backgroundPosition: fill.position || 'center',
    backgroundRepeat: 'no-repeat',
    ...(fill.opacity != null && fill.opacity < 1 ? { opacity: fill.opacity } : {}),
  };
}

/** pt → CSS px (the document is laid out at 96 CSS px per inch, 72pt per inch). */
export const pt = (v: number) => `${(v * 96) / 72}px`;
export const inch = (v: number) => `${v * 96}px`;

export function typoToStyle(typo: Typo | undefined, theme: Theme): React.CSSProperties {
  if (!typo) return {};
  const s: React.CSSProperties = {};
  if (typo.font) s.fontFamily = FONTS[typo.font].stack;
  if (typo.size != null) s.fontSize = pt(typo.size);
  if (typo.weight != null) s.fontWeight = typo.weight;
  if (typo.italic != null) s.fontStyle = typo.italic ? 'italic' : 'normal';
  if (typo.underline) s.textDecoration = 'underline';
  if (typo.color) s.color = resolveColor(typo.color, theme);
  if (typo.align) s.textAlign = typo.align;
  if (typo.lineHeight != null) s.lineHeight = typo.lineHeight;
  if (typo.spaceAfter != null) s.marginBottom = pt(typo.spaceAfter);
  return s;
}

/** CSS custom properties injected at the document root so blocks can use `var(--rb-cyan)`. */
export function themeVars(theme: Theme): React.CSSProperties {
  const vars: Record<string, string> = {
    '--rb-base-font': FONTS[theme.baseFont].stack,
    '--rb-base-size': pt(theme.baseSize),
    '--rb-base-lh': String(theme.baseLineHeight),
  };
  for (const [k, v] of Object.entries(theme.palette)) vars[`--rb-${k}`] = v;
  return vars as React.CSSProperties;
}

export const LETTER = { width: 8.5, height: 11 } as const;

export function pageGeometry(doc: Doc, page: Doc['pages'][number]) {
  const margin = page.margin ?? doc.pageSetup.margin;
  const columns = page.columns ?? doc.pageSetup.columns;
  return { margin, columns, gutter: doc.pageSetup.gutter };
}
