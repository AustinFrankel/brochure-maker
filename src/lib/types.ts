/**
 * The brochure document model.
 *
 * A Doc is a list of fixed-size Pages. Blocks are laid out one of two ways:
 *
 *  - **Flowed** (the default). Blocks stack top-to-bottom through a 1- or
 *    2-column newspaper grid, so lengthening a paragraph pushes everything
 *    below it down. This is what the hand-built templates use, and it is the
 *    reason this is an editor rather than a free canvas.
 *
 *  - **Placed** (`block.pos` set). The block sits at fixed coordinates on the
 *    page. Imported PDFs land this way, because a PDF records where each run of
 *    text was painted and not why — guessing a flow order from that would move
 *    things the author never meant to move.
 *
 * Both kinds can share a page, and a placed block can be released back into the
 * flow (and vice versa) from the inspector.
 */

export type Inches = number;

/** Palette slots. Every color in the document resolves through the theme so a
 *  single change restyles all pages at once. */
export type ColorToken =
  | 'cyan' | 'purple' | 'violet' | 'pink' | 'red' | 'black' | 'white';

/** A color is either a palette token (`"@cyan"`) or a literal (`"#ff0088"`). */
export type Color = string;

export type Fill =
  | { kind: 'none' }
  | { kind: 'color'; color: Color }
  | { kind: 'image'; url: string; fit: 'cover' | 'contain'; position: string; opacity?: number };

export type FontId = 'tinos' | 'carlito' | 'cinzel' | 'eb-garamond' | 'arimo' | 'georgia';

export type Align = 'left' | 'center' | 'right' | 'justify';

/** Per-block typography overrides. Anything omitted inherits from the theme. */
export type Typo = Partial<{
  font: FontId;
  size: number;          // pt
  weight: 400 | 700;
  italic: boolean;
  underline: boolean;
  color: Color;
  align: Align;
  lineHeight: number;    // unitless multiplier
  spaceAfter: number;    // pt of margin below the block
}>;

export type BlockType =
  | 'cover'
  | 'sectionTitle'
  | 'program'
  | 'richText'
  | 'labelValue'
  | 'infoTable'
  | 'photo'
  | 'highlightBox'
  | 'sidebarBox'
  | 'directoryBox'
  | 'qr'
  | 'socialRow'
  | 'formFields'
  | 'spacer';

export type SocialKind = 'x' | 'instagram' | 'facebook' | 'web';

export interface TableData {
  /** Header cells. Empty array renders a table with no header row. */
  head: string[];
  rows: string[][];
  /** Relative column widths; length should match `head`. */
  cols: number[];
  headFill: Fill;
  bodyFill: Fill;
  borderColor: Color;
  borderWidth: number;   // px
  fontSize?: number;     // pt, overrides block typo for the table only
}

export interface CoverProps {
  kicker: string;
  title: string;
  subtitle: string;
  photo: { url: string; focal: string };
  /** Lines in the bottom band. Plain text, so the inspector can offer a normal
   *  input; `scale` multiplies the band's base size for that one line. */
  footer: { text: string; scale?: number }[];
  socialPrefix: string;
  socials: { icon: SocialKind; handle: string }[];
  bandFill: Fill;
  /** Share of the page height taken by the photo, 0–1. */
  photoShare: number;
}

export interface ProgramProps {
  heading: string;
  /** Rich-text HTML. */
  body: string;
  table: TableData | null;
  /** "Who:", "Min:", "Grades:" lines under the table. */
  meta: { label: string; value: string }[];
  /** The violet "Checks payable to…" line. Empty string hides it. */
  note: string;
  headingColor: Color;
  noteColor: Color;
  metaLabelWidth: number;   // pt
}

export interface RichTextProps { html: string }

export interface LabelValueProps {
  rows: { label: string; value: string }[];
  labelWidth: number;       // pt
  labelBold: boolean;
  valueBold: boolean;
  valueColor: Color;
}

export interface PhotoProps {
  url: string;
  alt: string;
  /** `bleed` ignores the page margin and runs edge to edge. */
  width: 'column' | 'full' | 'bleed';
  /** Fixed height in inches, or null to keep the image's natural ratio. */
  height: Inches | null;
  fit: 'cover' | 'contain';
  focal: string;            // CSS object-position
  caption: string;
  borderColor: Color;
  borderWidth: number;
  radius: number;
}

export interface HighlightBoxProps {
  html: string;
  padding: number;          // pt
  borderColor: Color;
  borderWidth: number;
  /** Optional clip-art flanking the centered text (the Winterfest callout). */
  leftImage?: string;
  rightImage?: string;
  sideImageWidth?: number;  // pt
}

export interface SidebarBoxProps {
  logo: string;
  title: string;
  groups: { label: string; items: string[] }[];
  padding: number;
}

export interface DirectoryBoxProps {
  title: string;
  titleFont: FontId;
  entries: { label: string; page: string }[];
  padding: number;
  borderColor: Color;
  borderWidth: number;
}

export interface QrProps {
  /** URL encoded into the QR. Regenerated client-side whenever it changes. */
  data: string;
  caption: string;
  size: Inches;
  /** Optional uploaded image that replaces the generated code. */
  imageUrl: string;
}

export interface SocialRowProps {
  prefix: string;
  items: { icon: SocialKind; handle: string }[];
  iconSize: number;         // pt
  gap: number;              // pt
}

export interface FormFieldsProps {
  /** Each row is a series of `label` + ruled-line cells. */
  rows: { cells: { label: string; flex: number }[] }[];
  signatureLabel: string;
  lineColor: Color;
}

export interface SpacerProps { height: number }  // pt

export type BlockProps =
  | { type: 'cover'; props: CoverProps }
  | { type: 'sectionTitle'; props: RichTextProps }
  | { type: 'program'; props: ProgramProps }
  | { type: 'richText'; props: RichTextProps }
  | { type: 'labelValue'; props: LabelValueProps }
  | { type: 'infoTable'; props: TableData }
  | { type: 'photo'; props: PhotoProps }
  | { type: 'highlightBox'; props: HighlightBoxProps }
  | { type: 'sidebarBox'; props: SidebarBoxProps }
  | { type: 'directoryBox'; props: DirectoryBoxProps }
  | { type: 'qr'; props: QrProps }
  | { type: 'socialRow'; props: SocialRowProps }
  | { type: 'formFields'; props: FormFieldsProps }
  | { type: 'spacer'; props: SpacerProps };

/** Fixed placement on the page, in inches from the top-left of the sheet. */
export interface Placement {
  x: Inches;
  y: Inches;
  w: Inches;
  /** Set only when the block should be a fixed height; otherwise it grows with
   *  its content, which keeps imported text editable without clipping. */
  h?: Inches;
}

export type Block = {
  id: string;
  /** `full` spans both columns; `column` sits inside the column named by `col`. */
  span: 'column' | 'full';
  /** Which column a `span: 'column'` block sits in. Ignored on 1-column pages. */
  col?: 0 | 1;
  /** When set, the block is placed at these coordinates instead of flowing. */
  pos?: Placement | null;
  background: Fill;
  typo: Typo;
  /** pt of padding inside the block's background. */
  padding: number;
} & BlockProps;

export interface Page {
  id: string;
  background: Fill;
  /** Overrides Doc.pageSetup when set. */
  margin?: Inches;
  columns?: 1 | 2;
  /** Relative widths of the two columns. Defaults to equal. Page 2 of the Fall
   *  2025 brochure uses a narrow staff panel beside a wide letter. */
  colRatio?: [number, number];
  /** Decorative border around the whole page (the Paula's Pals flyer). */
  frame?: { color: Color; width: number; inset: Inches } | null;
  /** Hide the page number in the bottom margin. */
  hideNumber?: boolean;
  blocks: Block[];
}

export interface Theme {
  baseFont: FontId;
  baseSize: number;         // pt
  baseLineHeight: number;
  palette: Record<ColorToken, string>;
}

export interface PageSetup {
  /** Only Letter for now; the value is kept so other sizes can be added later. */
  size: 'letter';
  margin: Inches;
  columns: 1 | 2;
  gutter: Inches;
  numberFrom: number;
}

export interface Doc {
  version: 1;
  title: string;
  theme: Theme;
  pageSetup: PageSetup;
  pages: Page[];
}

export interface BrochureMeta {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  pageCount: number;
  thumbUrl: string | null;
}
