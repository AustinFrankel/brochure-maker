import { nanoid } from 'nanoid';
import type {
  Block, BlockType, Doc, Fill, Page, TableData,
} from './types';
import { DEFAULT_THEME } from './theme';

export const newId = () => nanoid(10);

export const NO_FILL: Fill = { kind: 'none' };
export const fill = (color: string): Fill => ({ kind: 'color', color });

export const BLOCK_LABELS: Record<BlockType, string> = {
  program:       'Program',
  richText:      'Text',
  sectionTitle:  'Section title',
  infoTable:     'Table',
  photo:         'Photo',
  highlightBox:  'Highlight box',
  labelValue:    'Detail list',
  cover:         'Cover',
  sidebarBox:    'Sidebar panel',
  directoryBox:  'Contents box',
  qr:            'QR code',
  socialRow:     'Social handles',
  formFields:    'Form',
  spacer:        'Spacer',
};

/** Order of the "add block" menu — most-used first. */
export const BLOCK_MENU_ORDER: BlockType[] = [
  'program', 'richText', 'sectionTitle', 'infoTable', 'photo', 'highlightBox',
  'labelValue', 'qr', 'socialRow', 'directoryBox', 'sidebarBox', 'formFields',
  'cover', 'spacer',
];

export function emptyTable(cols = 4): TableData {
  const head = ['Dates', 'Time', 'Fee', 'Location'].slice(0, cols);
  return {
    head,
    rows: [head.map(() => '')],
    cols: head.map(() => 1),
    headFill: fill('@cyan'),
    bodyFill: fill('@cyan'),
    borderColor: '@black',
    borderWidth: 2,
  };
}

/** Fresh block of the given type with sensible Rye Brook defaults. */
export function createBlock(type: BlockType): Block {
  const base = { id: newId(), span: 'column' as const, col: 0 as const, background: NO_FILL, typo: {}, padding: 0 };
  switch (type) {
    case 'cover':
      return { ...base, span: 'full', type, props: {
        kicker: 'Season Year Activities Brochure',
        title: 'COME JOIN THE FUN!',
        subtitle: 'Rye Brook Parks & Recreation Department',
        photo: { url: '/seed/photo-fall-path.jpg', focal: 'center' },
        footer: [
          { text: 'ONLINE REGISTRATION BEGINS' },
          { text: 'Month 0th @ 0:00PM' },
          { text: '' },
          { text: 'www.ryebrookny.gov', scale: 1.5 },
        ],
        socialPrefix: 'Follow us at:',
        socials: [{ icon: 'x', handle: '@ryebrookrec' }, { icon: 'instagram', handle: '@ryebrookrec' }],
        bandFill: fill('@cyan'),
        photoShare: 0.62,
      } };
    case 'sectionTitle':
      return { ...base, span: 'full', typo: { size: 20, weight: 700, align: 'center', underline: true, color: '@cyan', spaceAfter: 6 }, type, props: { html: 'Section Title' } };
    case 'program':
      return { ...base, type, props: {
        heading: 'Program Name',
        body: '<p>Describe the program here.</p>',
        table: emptyTable(),
        meta: [{ label: 'Who:', value: '' }],
        note: 'Checks payable to Rye Brook Recreation.',
        headingColor: '@purple',
        noteColor: '@violet',
        metaLabelWidth: 52,
      } };
    case 'richText':
      return { ...base, type, props: { html: '<p>Type here.</p>' } };
    case 'labelValue':
      return { ...base, type, props: {
        rows: [{ label: 'Who:', value: '' }, { label: 'Date:', value: '' }, { label: 'Location:', value: '' }],
        labelWidth: 62, labelBold: true, valueBold: true, valueColor: '@black',
      } };
    case 'infoTable':
      return { ...base, type, props: emptyTable() };
    case 'photo':
      return { ...base, type, props: {
        url: '', alt: '', width: 'column', height: null, fit: 'cover',
        focal: 'center', caption: '', borderColor: '@black', borderWidth: 0, radius: 0,
      } };
    case 'highlightBox':
      return { ...base, span: 'full', background: fill('@pink'), padding: 14,
        typo: { size: 26, weight: 700, align: 'center' },
        type, props: { html: '<p>Online Registration<br>Begins</p>', padding: 14, borderColor: '@black', borderWidth: 0 } };
    case 'sidebarBox':
      return { ...base, background: fill('@cyan'), padding: 10, type, props: {
        logo: '/seed/logo-village.png',
        title: 'Village of Rye Brook',
        groups: [{ label: 'Mayor', items: ['Name'] }],
        padding: 10,
      } };
    case 'directoryBox':
      return { ...base, background: fill('@cyan'), padding: 8, type, props: {
        title: 'DIRECTORY', titleFont: 'cinzel',
        entries: [{ label: 'Park information', page: '3' }],
        padding: 8, borderColor: '@black', borderWidth: 3,
      } };
    case 'qr':
      return { ...base, typo: { align: 'center' }, type, props: {
        data: 'https://www.ryebrookny.gov', caption: 'Scan me!', size: 2.1, imageUrl: '',
      } };
    case 'socialRow':
      return { ...base, type, props: {
        prefix: 'Follow us at:',
        items: [{ icon: 'x', handle: '@ryebrookrec' }, { icon: 'instagram', handle: '@ryebrookrec' }],
        iconSize: 26, gap: 14,
      } };
    case 'formFields':
      return { ...base, span: 'full', type, props: {
        rows: [{ cells: [{ label: 'Name:', flex: 3 }, { label: 'Sex: M', flex: 1 }] }],
        signatureLabel: 'Parent/Guardian Signature',
        lineColor: '@black',
      } };
    case 'spacer':
      return { ...base, type, props: { height: 12 } };
  }
}

export function createPage(blocks: Block[] = []): Page {
  return { id: newId(), background: NO_FILL, blocks, frame: null };
}

export function emptyDoc(title = 'Untitled brochure'): Doc {
  return {
    version: 1,
    title,
    theme: { ...DEFAULT_THEME, palette: { ...DEFAULT_THEME.palette } },
    pageSetup: { size: 'letter', margin: 0.55, columns: 2, gutter: 0.3, numberFrom: 1 },
    pages: [createPage([createBlock('sectionTitle')])],
  };
}

/** Deep clone with fresh ids, used by page/block duplicate and by "duplicate brochure". */
export function cloneBlock(b: Block): Block {
  return { ...structuredClone(b), id: newId() };
}
export function clonePage(p: Page): Page {
  return { ...structuredClone(p), id: newId(), blocks: p.blocks.map(cloneBlock) };
}
export function cloneDoc(d: Doc, title?: string): Doc {
  return { ...structuredClone(d), title: title ?? d.title, pages: d.pages.map(clonePage) };
}

export function findBlock(doc: Doc, blockId: string): { page: Page; block: Block; pageIndex: number; blockIndex: number } | null {
  for (let pi = 0; pi < doc.pages.length; pi++) {
    const bi = doc.pages[pi].blocks.findIndex((b) => b.id === blockId);
    if (bi >= 0) return { page: doc.pages[pi], block: doc.pages[pi].blocks[bi], pageIndex: pi, blockIndex: bi };
  }
  return null;
}

/** Forward-compatible loader: unknown future versions still open, oldest wins. */
export function migrate(raw: unknown): Doc {
  const d = raw as Doc;
  if (!d || typeof d !== 'object' || !Array.isArray(d.pages)) return emptyDoc();
  return {
    ...emptyDoc(d.title || 'Untitled brochure'),
    ...d,
    version: 1,
    theme: { ...DEFAULT_THEME, ...d.theme, palette: { ...DEFAULT_THEME.palette, ...(d.theme?.palette ?? {}) } },
    pages: d.pages.map((page) => ({
      ...page,
      blocks: (page.blocks ?? []).map(migrateBlock),
    })),
  };
}

/** Per-block upgrades for documents written by an older build. */
function migrateBlock(block: Block): Block {
  if (block.type === 'cover') {
    const footer = block.props.footer as unknown[];
    // v0 stored cover footer lines as rich-text HTML strings.
    if (footer.some((l) => typeof l === 'string')) {
      return {
        ...block,
        props: {
          ...block.props,
          footer: footer.map((l) =>
            typeof l === 'string'
              ? { text: l.replace(/<[^>]*>/g, '').trim() }
              : (l as { text: string; scale?: number })),
        },
      };
    }
  }
  return block;
}
