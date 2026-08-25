'use client';

import type {
  Block, HighlightBoxProps, LabelValueProps, ProgramProps, Theme,
} from '@/lib/types';
import { fillToStyle, pt, resolveColor, typoToStyle } from '@/lib/theme';
import { RichText } from './RichText';
import { InlineText, PlainEdit } from '@/components/editor/InlineText';
import { InfoTable } from './blocks/table';
import { Photo, Qr, SocialRow } from './blocks/media';
import { Cover, DirectoryBox, FormFields, SidebarBox } from './blocks/panels';

/** When a block is selected in the editor its text becomes editable in place. */
export type EditHooks = {
  editing: boolean;
  setProps: (patch: Record<string, unknown>) => void;
};

const NOT_EDITING: EditHooks = { editing: false, setProps: () => {} };

function Program({ p, theme, ed }: { p: ProgramProps; theme: Theme; ed: EditHooks }) {
  return (
    <div className="rb-program">
      {(p.heading || ed.editing) && (
        <PlainEdit
          className="rb-program-heading"
          style={{ color: resolveColor(p.headingColor, theme) }}
          value={p.heading} active={ed.editing} placeholder="Program name"
          onChange={(heading) => ed.setProps({ heading })}
        />
      )}
      {(p.body || ed.editing) && (
        <InlineText
          html={p.body} active={ed.editing} className="rb-program-body"
          onChange={(body) => ed.setProps({ body })}
        />
      )}
      {p.table && <InfoTable t={p.table} theme={theme} />}
      {p.meta.length > 0 && (
        <div className="rb-program-meta">
          {p.meta.map((m, i) => (
            <div className="rb-meta-row" key={i}>
              <span className="rb-meta-label" style={{ width: pt(p.metaLabelWidth) }}>{m.label}</span>
              <span className="rb-meta-value">{m.value}</span>
            </div>
          ))}
        </div>
      )}
      {p.note && (
        <div className="rb-program-note" style={{ color: resolveColor(p.noteColor, theme) }}>
          {p.note}
        </div>
      )}
    </div>
  );
}

function LabelValue({ p, theme }: { p: LabelValueProps; theme: Theme }) {
  return (
    <div className="rb-lv">
      {p.rows.map((r, i) => (
        <div className="rb-lv-row" key={i}>
          <span className="rb-lv-label" style={{ width: pt(p.labelWidth), fontWeight: p.labelBold ? 700 : 400 }}>
            {r.label}
          </span>
          <span
            className="rb-lv-value"
            style={{ fontWeight: p.valueBold ? 700 : 400, color: resolveColor(p.valueColor, theme) }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Highlight({ p, ed }: { p: HighlightBoxProps; ed: EditHooks }) {
  const body = (
    <InlineText
      html={p.html} active={ed.editing} inline
      style={p.leftImage || p.rightImage ? { flex: 1 } : undefined}
      onChange={(html) => ed.setProps({ html })}
    />
  );
  if (!p.leftImage && !p.rightImage) return body;
  const w = pt(p.sideImageWidth ?? 72);
  return (
    <div className="rb-highlight-flank">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.leftImage ? <img src={p.leftImage} alt="" style={{ width: w }} /> : <span style={{ width: w }} />}
      {body}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.rightImage ? <img src={p.rightImage} alt="" style={{ width: w }} /> : <span style={{ width: w }} />}
    </div>
  );
}

function Inner({ block, theme, ed }: { block: Block; theme: Theme; ed: EditHooks }) {
  switch (block.type) {
    case 'cover':        return <Cover p={block.props} theme={theme} />;
    case 'sectionTitle': return <InlineText html={block.props.html} active={ed.editing} inline onChange={(html) => ed.setProps({ html })} />;
    case 'program':      return <Program p={block.props} theme={theme} ed={ed} />;
    case 'richText':     return <InlineText html={block.props.html} active={ed.editing} onChange={(html) => ed.setProps({ html })} />;
    case 'labelValue':   return <LabelValue p={block.props} theme={theme} />;
    case 'infoTable':    return <InfoTable t={block.props} theme={theme} />;
    case 'photo':        return <Photo p={block.props} theme={theme} />;
    case 'highlightBox': return <Highlight p={block.props} ed={ed} />;
    case 'sidebarBox':   return <SidebarBox p={block.props} />;
    case 'directoryBox': return <DirectoryBox p={block.props} theme={theme} />;
    case 'qr':           return <Qr p={block.props} />;
    case 'socialRow':    return <SocialRow p={block.props} />;
    case 'formFields':   return <FormFields p={block.props} theme={theme} />;
    case 'spacer':       return <div style={{ height: pt(block.props.height) }} />;
  }
}

/** One block, rendered identically in the editor and in the PDF. */
export function BlockView({ block, theme, ed = NOT_EDITING }: {
  block: Block; theme: Theme; ed?: EditHooks;
}) {
  const isBleed = block.type === 'photo' && block.props.width === 'bleed';
  return (
    <div
      data-block-id={block.id}
      data-block-type={block.type}
      className={`rb-block rb-block-${block.type}${block.span === 'full' ? ' rb-span-full' : ''}${isBleed ? ' rb-bleed' : ''}`}
      style={{
        ...fillToStyle(block.background, theme),
        ...typoToStyle(block.typo, theme),
        ...(block.padding ? { padding: pt(block.padding) } : {}),
      }}
    >
      <Inner block={block} theme={theme} ed={ed} />
    </div>
  );
}

export { RichText };
