/**
 * The brochures offered on the "New" menu.
 *
 * `fall2025` is hand-built from blocks, so every heading, table and photo is a
 * first-class object that reflows when edited. The other two were brought in
 * through the PDF importer and are stored as plain documents; their pages carry
 * the original artwork as a background with all the text lifted off into
 * editable blocks on top.
 */
import type { Doc } from '@/lib/types';
import { cloneDoc, emptyDoc, migrate } from '@/lib/doc';
import { fall2025 } from '@/lib/seed/fall-2025';
import springSummer2026 from './data/spring-summer-2026.json';
import winter2025 from './data/winter-2025-2026.json';

export interface TemplateInfo {
  id: string;
  name: string;
  /** One line, shown under the name on the New menu. */
  blurb: string;
  pages: number;
  kind: 'blocks' | 'imported' | 'blank';
}

type Builder = (title: string) => Doc;

const BUILDERS: Record<string, Builder> = {
  'fall-2025':          (t) => cloneDoc(fall2025(), t),
  'spring-summer-2026': (t) => cloneDoc(migrate(springSummer2026), t),
  'winter-2025-2026':   (t) => cloneDoc(migrate(winter2025), t),
  blank:                (t) => emptyDoc(t),
};

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'fall-2025',
    name: 'Fall 2025',
    blurb: 'Rebuilt block by block — every heading, table and photo reflows as you edit.',
    pages: 14,
    kind: 'blocks',
  },
  {
    id: 'spring-summer-2026',
    name: 'Spring / Summer 2026',
    blurb: 'The original artwork with all of its text made editable.',
    pages: (springSummer2026 as { pages?: unknown[] }).pages?.length ?? 0,
    kind: 'imported',
  },
  {
    id: 'winter-2025-2026',
    name: 'Winter 2025-26',
    blurb: 'The original artwork with all of its text made editable.',
    pages: (winter2025 as { pages?: unknown[] }).pages?.length ?? 0,
    kind: 'imported',
  },
  {
    id: 'blank',
    name: 'Blank',
    blurb: 'One empty page. Start from nothing.',
    pages: 1,
    kind: 'blank',
  },
];

export function buildTemplate(id: string, title: string): Doc {
  return (BUILDERS[id] ?? BUILDERS['fall-2025'])(title);
}

/** First page only — enough to draw a card thumbnail without shipping the rest. */
export function templateCover(id: string): Doc | null {
  const raw =
    id === 'spring-summer-2026' ? springSummer2026
    : id === 'winter-2025-2026' ? winter2025
    : null;
  if (raw) {
    const d = migrate(raw);
    return { ...d, pages: d.pages.slice(0, 1) };
  }
  if (id === 'fall-2025') {
    const d = fall2025();
    return { ...d, pages: d.pages.slice(0, 1) };
  }
  return null;
}
