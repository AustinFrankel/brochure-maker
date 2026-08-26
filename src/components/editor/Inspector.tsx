'use client';

import type { Block, Doc, TableData } from '@/lib/types';
import { BLOCK_LABELS } from '@/lib/doc';
import { useEditor } from '@/lib/store';
import { pickImage } from '@/lib/upload';
import {
  ALIGNS, Field, FillPicker, FontPicker, Num, RowList, Seg, Swatches, Text, Toggle,
} from './fields/controls';

/** Editable settings for the `TableData` shared by program and standalone tables. */
function TableEditor({ t, onChange, theme }: { t: TableData; onChange: (t: TableData) => void; theme: Doc['theme'] }) {
  const cells = Math.max(t.head.length, t.cols.length, t.rows[0]?.length ?? 0) || 1;

  const setColumnCount = (n: number) => {
    const head = Array.from({ length: n }, (_, i) => t.head[i] ?? '');
    onChange({
      ...t,
      head: t.head.length ? head : [],
      cols: Array.from({ length: n }, (_, i) => t.cols[i] ?? 1),
      rows: t.rows.map((r) => Array.from({ length: n }, (_, i) => r[i] ?? '')),
    });
  };

  return (
    <>
      <Num label="Columns" value={cells} min={1} max={7} onChange={setColumnCount} />

      <Toggle
        label="Show header row"
        value={t.head.length > 0}
        onChange={(v) => onChange({ ...t, head: v ? Array.from({ length: cells }, (_, i) => t.head[i] ?? '') : [] })}
      />

      {t.head.length > 0 && (
        <Field label="Column headings">
          <div className="rows">
            {t.head.map((h, i) => (
              <input
                key={i} value={h} placeholder={`Column ${i + 1}`}
                onChange={(e) => onChange({ ...t, head: t.head.map((x, j) => (j === i ? e.target.value : x)) })}
              />
            ))}
          </div>
        </Field>
      )}

      <RowList
        label="Rows"
        items={t.rows}
        onChange={(rows) => onChange({ ...t, rows })}
        blank={() => Array.from({ length: cells }, () => '')}
        addLabel="Add row"
        render={(row, set) => (
          <div style={{ display: 'flex', gap: 3, flex: 1, minWidth: 0 }}>
            {Array.from({ length: cells }, (_, i) => (
              <input
                key={i} value={row[i] ?? ''} placeholder={t.head[i] || `#${i + 1}`}
                onChange={(e) => set(Array.from({ length: cells }, (_, j) => (j === i ? e.target.value : row[j] ?? '')))}
              />
            ))}
          </div>
        )}
      />

      <Field label="Column widths">
        <div style={{ display: 'flex', gap: 3 }}>
          {t.cols.map((c, i) => (
            <input
              key={i} type="number" step={0.1} min={0.2} value={c}
              onChange={(e) => onChange({ ...t, cols: t.cols.map((x, j) => (j === i ? Number(e.target.value) : x)) })}
            />
          ))}
        </div>
      </Field>

      <Swatches
        label="Fill" theme={theme}
        value={t.bodyFill.kind === 'color' ? t.bodyFill.color : undefined}
        onChange={(c) => onChange({
          ...t,
          bodyFill: c ? { kind: 'color', color: c } : { kind: 'none' },
          headFill: c ? { kind: 'color', color: c } : { kind: 'none' },
        })}
        allowNone
      />
      <div className="fld-row">
        <Num label="Border" value={t.borderWidth} min={0} max={6} onChange={(borderWidth) => onChange({ ...t, borderWidth })} suffix="px" />
      </div>
      <Swatches label="Border color" theme={theme} value={t.borderColor} onChange={(c) => onChange({ ...t, borderColor: c ?? '@black' })} />
      <Num label="Table text size" value={t.fontSize ?? 11} min={6} max={20} step={0.5} onChange={(fontSize) => onChange({ ...t, fontSize })} suffix="pt" />
    </>
  );
}

/** Fields unique to each block type. */
function TypeFields({ block, theme }: { block: Block; theme: Doc['theme'] }) {
  const set = useEditor((s) => s.updateBlockProps);
  const p = (patch: Record<string, unknown>) => set(block.id, patch);

  switch (block.type) {
    case 'cover': {
      const c = block.props;
      return (
        <>
          <Text label="Small line above" value={c.kicker} onChange={(kicker) => p({ kicker })} />
          <Text label="Big title" value={c.title} onChange={(title) => p({ title })} />
          <Text label="Line below title" value={c.subtitle} onChange={(subtitle) => p({ subtitle })} />
          <Field label="Cover photo">
            <button className="btn btn-sm" onClick={() => pickImage((url) => p({ photo: { ...c.photo, url } }), alert)}>
              {c.photo.url ? 'Replace photo…' : 'Choose photo…'}
            </button>
          </Field>
          <Num label="Photo height" value={Math.round(c.photoShare * 100)} min={20} max={85} onChange={(v) => p({ photoShare: v / 100 })} suffix="% of page" />
          <RowList
            label="Lines in the bottom band" items={c.footer} addLabel="Add line"
            blank={() => ({ text: '' }) as { text: string; scale?: number }}
            onChange={(footer) => p({ footer })}
            render={(line, s) => (
              <>
                <input
                  value={line.text} placeholder="(blank line)"
                  onChange={(e) => s({ ...line, text: e.target.value })}
                />
                <button
                  type="button" className="btn btn-sm btn-icon" title="Make this line bigger"
                  style={(line.scale ?? 1) > 1 ? { background: 'var(--ui-accent-soft)', borderColor: 'var(--ui-accent)' } : undefined}
                  onClick={() => s({ ...line, scale: (line.scale ?? 1) > 1 ? undefined : 1.5 })}
                >A</button>
              </>
            )}
          />
          <Text label="Text before the handles" value={c.socialPrefix} onChange={(socialPrefix) => p({ socialPrefix })} />
          <RowList
            label="Social handles" items={c.socials} addLabel="Add handle"
            blank={() => ({ icon: 'x' as const, handle: '@ryebrookrec' })}
            onChange={(socials) => p({ socials })}
            render={(it, s) => (
              <>
                <select value={it.icon} style={{ width: 96 }} onChange={(e) => s({ ...it, icon: e.target.value as typeof it.icon })}>
                  <option value="x">X</option><option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option><option value="web">Web</option>
                </select>
                <input value={it.handle} onChange={(e) => s({ ...it, handle: e.target.value })} />
              </>
            )}
          />
          <Swatches label="Band color" theme={theme}
            value={c.bandFill.kind === 'color' ? c.bandFill.color : undefined}
            onChange={(col) => p({ bandFill: col ? { kind: 'color', color: col } : { kind: 'none' } })} />
        </>
      );
    }

    case 'program': {
      const g = block.props;
      return (
        <>
          <Text label="Heading" value={g.heading} onChange={(heading) => p({ heading })} />
          <Swatches label="Heading color" theme={theme} value={g.headingColor} onChange={(c) => p({ headingColor: c ?? '@purple' })} />
          <Field label="Description">
            <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', lineHeight: 1.4 }}>
              Type straight onto the page — the description is live while this block is selected.
            </div>
          </Field>
          <RowList
            label="Detail lines (Who:, Min:, …)" items={g.meta} addLabel="Add line"
            blank={() => ({ label: 'Who:', value: '' })}
            onChange={(meta) => p({ meta })}
            render={(m, s) => (
              <>
                <input value={m.label} style={{ width: 84 }} onChange={(e) => s({ ...m, label: e.target.value })} />
                <input value={m.value} onChange={(e) => s({ ...m, value: e.target.value })} />
              </>
            )}
          />
          <Num label="Detail label width" value={g.metaLabelWidth} min={0} max={200} step={2} onChange={(metaLabelWidth) => p({ metaLabelWidth })} suffix="pt" />
          <Text label="Note under the block" value={g.note} onChange={(note) => p({ note })} placeholder="Checks payable to…" />
          <Swatches label="Note color" theme={theme} value={g.noteColor} onChange={(c) => p({ noteColor: c ?? '@violet' })} />

          <details className="sect" open={!!g.table}>
            <summary>Schedule table</summary>
            <Toggle
              label="Show a schedule table" value={!!g.table}
              onChange={(v) => p({
                table: v
                  ? {
                      head: ['Dates', 'Time', 'Fee', 'Location'],
                      rows: [['', '', '', '']], cols: [2.2, 1.5, 0.9, 1.7],
                      headFill: { kind: 'color', color: '@cyan' }, bodyFill: { kind: 'color', color: '@cyan' },
                      borderColor: '@black', borderWidth: 2,
                    }
                  : null,
              })}
            />
            {g.table && <TableEditor t={g.table} theme={theme} onChange={(table) => p({ table })} />}
          </details>
        </>
      );
    }

    case 'infoTable':
      return <TableEditor t={block.props} theme={theme} onChange={(t) => set(block.id, t as unknown as Record<string, unknown>)} />;

    case 'photo': {
      const ph = block.props;
      return (
        <>
          <Field label="Image">
            <div className="fld-row">
              <button className="btn btn-sm" onClick={() => pickImage((url) => p({ url }), alert)}>
                {ph.url ? 'Replace…' : 'Choose photo…'}
              </button>
              {ph.url && <button className="btn btn-sm btn-danger" onClick={() => p({ url: '' })}>Remove</button>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ui-muted)', marginTop: 5 }}>
              You can also drag an image file straight onto the photo on the page.
            </div>
          </Field>
          <Seg label="Width" value={ph.width}
            options={[{ value: 'column', label: 'Column' }, { value: 'full', label: 'Full' }, { value: 'bleed', label: 'Edge' }]}
            onChange={(width) => p({ width })} />
          <Toggle label="Fixed height (crop to fit)" value={ph.height != null} onChange={(v) => p({ height: v ? 2 : null })} />
          {ph.height != null && (
            <>
              <Num label="Height" value={ph.height} min={0.3} max={11} step={0.05} onChange={(height) => p({ height })} suffix="in" />
              <Seg label="Fit" value={ph.fit}
                options={[{ value: 'cover', label: 'Fill' }, { value: 'contain', label: 'Fit inside' }]}
                onChange={(fit) => p({ fit })} />
              <Seg label="Focus" value={ph.focal}
                options={[{ value: 'top', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'bottom', label: 'Bottom' }]}
                onChange={(focal) => p({ focal })} />
            </>
          )}
          <Text label="Caption" value={ph.caption} onChange={(caption) => p({ caption })} />
          <div className="fld-row">
            <Num label="Border" value={ph.borderWidth} min={0} max={8} onChange={(borderWidth) => p({ borderWidth })} suffix="px" />
            <Num label="Corners" value={ph.radius} min={0} max={40} onChange={(radius) => p({ radius })} suffix="px" />
          </div>
          {ph.borderWidth > 0 && <Swatches label="Border color" theme={theme} value={ph.borderColor} onChange={(c) => p({ borderColor: c ?? '@black' })} />}
        </>
      );
    }

    case 'labelValue': {
      const l = block.props;
      return (
        <>
          <RowList
            label="Rows" items={l.rows} addLabel="Add row"
            blank={() => ({ label: '', value: '' })}
            onChange={(rows) => p({ rows })}
            render={(r, s) => (
              <>
                <input value={r.label} style={{ width: 90 }} placeholder="Label" onChange={(e) => s({ ...r, label: e.target.value })} />
                <input value={r.value} placeholder="Value" onChange={(e) => s({ ...r, value: e.target.value })} />
              </>
            )}
          />
          <Num label="Label column width" value={l.labelWidth} min={0} max={240} step={2} onChange={(labelWidth) => p({ labelWidth })} suffix="pt" />
          <Toggle label="Bold labels" value={l.labelBold} onChange={(labelBold) => p({ labelBold })} />
          <Toggle label="Bold values" value={l.valueBold} onChange={(valueBold) => p({ valueBold })} />
          <Swatches label="Value color" theme={theme} value={l.valueColor} onChange={(c) => p({ valueColor: c ?? '@black' })} />
        </>
      );
    }

    case 'highlightBox': {
      const h = block.props;
      return (
        <>
          <Field label="Text">
            <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', lineHeight: 1.4 }}>
              Type straight onto the page while this block is selected.
            </div>
          </Field>
          <div className="fld-row">
            <Num label="Border" value={h.borderWidth} min={0} max={8} onChange={(borderWidth) => p({ borderWidth })} suffix="px" />
          </div>
          {h.borderWidth > 0 && <Swatches label="Border color" theme={theme} value={h.borderColor} onChange={(c) => p({ borderColor: c ?? '@black' })} />}
          <Field label="Side images">
            <div className="fld-row">
              <button className="btn btn-sm" onClick={() => pickImage((leftImage) => p({ leftImage }), alert)}>Left…</button>
              <button className="btn btn-sm" onClick={() => pickImage((rightImage) => p({ rightImage }), alert)}>Right…</button>
              {(h.leftImage || h.rightImage) && (
                <button className="btn btn-sm btn-danger" onClick={() => p({ leftImage: '', rightImage: '' })}>Clear</button>
              )}
            </div>
          </Field>
          {(h.leftImage || h.rightImage) && (
            <Num label="Side image width" value={h.sideImageWidth ?? 72} min={20} max={200} step={2} onChange={(sideImageWidth) => p({ sideImageWidth })} suffix="pt" />
          )}
        </>
      );
    }

    case 'sidebarBox': {
      const sb = block.props;
      return (
        <>
          <Field label="Logo">
            <div className="fld-row">
              <button className="btn btn-sm" onClick={() => pickImage((logo) => p({ logo }), alert)}>Choose…</button>
              {sb.logo && <button className="btn btn-sm btn-danger" onClick={() => p({ logo: '' })}>Remove</button>}
            </div>
          </Field>
          <Text label="Panel title" value={sb.title} onChange={(title) => p({ title })} />
          <RowList
            label="Groups" items={sb.groups} addLabel="Add group"
            blank={() => ({ label: 'Group', items: [''] })}
            onChange={(groups) => p({ groups })}
            render={(g, s) => (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <input value={g.label} placeholder="Group heading" onChange={(e) => s({ ...g, label: e.target.value })} />
                <textarea
                  rows={Math.min(8, g.items.length + 1)} value={g.items.join('\n')}
                  placeholder="One name per line"
                  onChange={(e) => s({ ...g, items: e.target.value.split('\n') })}
                />
              </div>
            )}
          />
        </>
      );
    }

    case 'directoryBox': {
      const d = block.props;
      return (
        <>
          <Text label="Box title" value={d.title} onChange={(title) => p({ title })} />
          <FontPicker label="Title font" value={d.titleFont} onChange={(titleFont) => p({ titleFont: titleFont ?? 'cinzel' })} />
          <RowList
            label="Entries" items={d.entries} addLabel="Add entry"
            blank={() => ({ label: '', page: '' })}
            onChange={(entries) => p({ entries })}
            render={(e, s) => (
              <>
                <input value={e.label} placeholder="Section" onChange={(ev) => s({ ...e, label: ev.target.value })} />
                <input value={e.page} placeholder="Pg" style={{ width: 54 }} onChange={(ev) => s({ ...e, page: ev.target.value })} />
              </>
            )}
          />
          <Num label="Border" value={d.borderWidth} min={0} max={8} onChange={(borderWidth) => p({ borderWidth })} suffix="px" />
          {d.borderWidth > 0 && <Swatches label="Border color" theme={theme} value={d.borderColor} onChange={(c) => p({ borderColor: c ?? '@black' })} />}
        </>
      );
    }

    case 'qr': {
      const q = block.props;
      return (
        <>
          <Text label="Link the code opens" value={q.data} onChange={(data) => p({ data })} placeholder="https://…" />
          <Text label="Caption" value={q.caption} onChange={(caption) => p({ caption })} />
          <Num label="Size" value={q.size} min={0.5} max={5} step={0.05} onChange={(size) => p({ size })} suffix="in" />
          <Field label="Or use your own image">
            <div className="fld-row">
              <button className="btn btn-sm" onClick={() => pickImage((imageUrl) => p({ imageUrl }), alert)}>Choose…</button>
              {q.imageUrl && <button className="btn btn-sm btn-danger" onClick={() => p({ imageUrl: '' })}>Back to generated</button>}
            </div>
          </Field>
        </>
      );
    }

    case 'socialRow': {
      const s2 = block.props;
      return (
        <>
          <Text label="Text before the handles" value={s2.prefix} onChange={(prefix) => p({ prefix })} />
          <RowList
            label="Handles" items={s2.items} addLabel="Add handle"
            blank={() => ({ icon: 'x' as const, handle: '' })}
            onChange={(items) => p({ items })}
            render={(it, s) => (
              <>
                <select value={it.icon} style={{ width: 96 }} onChange={(e) => s({ ...it, icon: e.target.value as typeof it.icon })}>
                  <option value="x">X</option><option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option><option value="web">Web</option>
                </select>
                <input value={it.handle} onChange={(e) => s({ ...it, handle: e.target.value })} />
              </>
            )}
          />
          <div className="fld-row">
            <Num label="Icon size" value={s2.iconSize} min={8} max={60} onChange={(iconSize) => p({ iconSize })} suffix="pt" />
            <Num label="Spacing" value={s2.gap} min={0} max={60} onChange={(gap) => p({ gap })} suffix="pt" />
          </div>
        </>
      );
    }

    case 'formFields': {
      const f = block.props;
      return (
        <>
          <RowList
            label="Form rows" items={f.rows} addLabel="Add row"
            blank={() => ({ cells: [{ label: '', flex: 1 }] })}
            onChange={(rows) => p({ rows })}
            render={(row, s) => (
              <textarea
                rows={1} value={row.cells.map((c) => c.label).join(' | ')}
                placeholder="Label | Second label"
                onChange={(e) => s({
                  cells: e.target.value.split('|').map((label, i) => ({
                    label: label.trim(), flex: row.cells[i]?.flex ?? 1,
                  })),
                })}
              />
            )}
          />
          <div style={{ fontSize: 12, color: 'var(--ui-muted)', marginTop: -6, marginBottom: 12 }}>
            Separate side-by-side fields on one row with <code>|</code>.
          </div>
          <Text label="Signature label" value={f.signatureLabel} onChange={(signatureLabel) => p({ signatureLabel })} />
          <Swatches label="Line color" theme={theme} value={f.lineColor} onChange={(c) => p({ lineColor: c ?? '@black' })} />
        </>
      );
    }

    case 'spacer':
      return <Num label="Height" value={block.props.height} min={0} max={400} step={2} onChange={(height) => p({ height })} suffix="pt" />;

    case 'richText':
    case 'sectionTitle':
      return (
        <Field>
          <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', lineHeight: 1.45 }}>
            Type straight onto the page. Select words to bold, italicize, underline or recolor them.
          </div>
        </Field>
      );
  }
}

export function Inspector({ doc }: { doc: Doc }) {
  const blockId = useEditor((s) => s.selectedBlockId);
  const pageIndex = useEditor((s) => s.selectedPageIndex);
  const updateBlock = useEditor((s) => s.updateBlock);
  const setTypo = useEditor((s) => s.setBlockTypo);
  const duplicateBlock = useEditor((s) => s.duplicateBlock);
  const deleteBlock = useEditor((s) => s.deleteBlock);

  const block = doc.pages.flatMap((p) => p.blocks).find((b) => b.id === blockId) ?? null;
  const theme = doc.theme;

  if (!block) return <PageInspector doc={doc} pageIndex={pageIndex} />;

  const t = block.typo;

  return (
    <div className="insp">
      <div className="insp-head">
        <span className="insp-kind">{BLOCK_LABELS[block.type]}</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" title="Duplicate" onClick={() => duplicateBlock(block.id)}>⧉</button>
          <button className="btn btn-sm btn-danger" title="Delete" onClick={() => deleteBlock(block.id)}>🗑</button>
        </span>
      </div>

      <TypeFields block={block} theme={theme} />

      <details className="sect" open>
        <summary>Background</summary>
        <FillPicker
          value={block.background} theme={theme}
          onChange={(background) => updateBlock(block.id, { background })}
          onPickImage={() => pickImage(
            (url) => updateBlock(block.id, { background: { kind: 'image', url, fit: 'cover', position: 'center' } }),
            alert,
          )}
        />
        <Num label="Inner padding" value={block.padding} min={0} max={60} step={1} onChange={(padding) => updateBlock(block.id, { padding })} suffix="pt" />
      </details>

      <details className="sect">
        <summary>Text style</summary>
        <FontPicker label="Font" value={t.font} allowInherit onChange={(font) => setTypo(block.id, { font })} />
        <div className="fld-row">
          <Num label="Size" value={t.size ?? theme.baseSize} min={5} max={90} step={0.5} onChange={(size) => setTypo(block.id, { size })} suffix="pt" />
          <Num label="Line height" value={t.lineHeight ?? theme.baseLineHeight} min={0.8} max={2.5} step={0.02} onChange={(lineHeight) => setTypo(block.id, { lineHeight })} />
        </div>
        <Field label="Style">
          <div className="fld-row">
            <button className="btn btn-sm" data-active={t.weight === 700}
              style={t.weight === 700 ? { background: 'var(--ui-accent-soft)', borderColor: 'var(--ui-accent)' } : undefined}
              onClick={() => setTypo(block.id, { weight: t.weight === 700 ? 400 : 700 })}><b>B</b></button>
            <button className="btn btn-sm"
              style={t.italic ? { background: 'var(--ui-accent-soft)', borderColor: 'var(--ui-accent)' } : undefined}
              onClick={() => setTypo(block.id, { italic: !t.italic })}><i>I</i></button>
            <button className="btn btn-sm"
              style={t.underline ? { background: 'var(--ui-accent-soft)', borderColor: 'var(--ui-accent)' } : undefined}
              onClick={() => setTypo(block.id, { underline: !t.underline })}><u>U</u></button>
          </div>
        </Field>
        <Seg label="Alignment" value={t.align ?? 'left'} options={ALIGNS} onChange={(align) => setTypo(block.id, { align })} />
        <Swatches label="Text color" theme={theme} value={t.color} allowNone noneLabel="Default"
          onChange={(color) => setTypo(block.id, { color })} />
        <Num label="Space below block" value={t.spaceAfter ?? 6} min={0} max={80} step={1} onChange={(spaceAfter) => setTypo(block.id, { spaceAfter })} suffix="pt" />
      </details>

      <details className="sect" open={!!block.pos}>
        <summary>Position</summary>

        {block.pos ? (
          <>
            <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', lineHeight: 1.45, marginBottom: 10 }}>
              This block sits at a fixed spot on the page — drag the ⠿ handle to move it,
              or set the numbers below.
            </div>
            <div className="fld-row">
              <Num label="From left" value={block.pos.x} min={-2} max={8.5} step={0.02} suffix="in"
                onChange={(x) => updateBlock(block.id, { pos: { ...block.pos!, x } })} />
              <Num label="From top" value={block.pos.y} min={-2} max={11} step={0.02} suffix="in"
                onChange={(y) => updateBlock(block.id, { pos: { ...block.pos!, y } })} />
            </div>
            <Num label="Width" value={block.pos.w} min={0.25} max={8.5} step={0.02} suffix="in"
              onChange={(w) => updateBlock(block.id, { pos: { ...block.pos!, w } })} />
            <button
              className="btn btn-sm" style={{ marginTop: 2 }}
              onClick={() => updateBlock(block.id, { pos: null })}
            >
              Let it flow with the page
            </button>
          </>
        ) : (
          <>
            <Seg label="Width" value={block.span}
              options={[{ value: 'column', label: 'One column' }, { value: 'full', label: 'Across the page' }]}
              onChange={(span) => updateBlock(block.id, { span })} />
            {block.span === 'column' && (doc.pages[pageIndex]?.columns ?? doc.pageSetup.columns) === 2 && (
              <Seg label="Column" value={block.col ?? 0}
                options={[{ value: 0, label: 'Left' }, { value: 1, label: 'Right' }]}
                onChange={(col) => updateBlock(block.id, { col })} />
            )}
            <button
              className="btn btn-sm" style={{ marginTop: 6 }}
              onClick={() => updateBlock(block.id, { pos: { x: 1, y: 1, w: 3 } })}
            >
              Pin to a fixed spot
            </button>
          </>
        )}
      </details>
    </div>
  );
}

/** Shown when nothing is selected: settings for the page you're looking at. */
function PageInspector({ doc, pageIndex }: { doc: Doc; pageIndex: number }) {
  const updatePage = useEditor((s) => s.updatePage);
  const duplicatePage = useEditor((s) => s.duplicatePage);
  const deletePage = useEditor((s) => s.deletePage);
  const page = doc.pages[pageIndex];
  if (!page) return <div className="insp-empty">Select a block to edit it.</div>;

  const frame = page.frame;

  return (
    <div className="insp">
      <div className="insp-head">
        <span className="insp-kind">Page {pageIndex + 1}</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" title="Duplicate page" onClick={() => duplicatePage(pageIndex)}>⧉</button>
          <button className="btn btn-sm btn-danger" title="Delete page" disabled={doc.pages.length <= 1}
            onClick={() => { if (confirm(`Delete page ${pageIndex + 1}?`)) deletePage(pageIndex); }}>🗑</button>
        </span>
      </div>

      <div className="insp-empty" style={{ padding: '0 0 12px' }}>
        Tap a block on the page to edit it.
      </div>

      <FillPicker
        label="Page background" value={page.background} theme={doc.theme}
        onChange={(background) => updatePage(pageIndex, { background })}
        onPickImage={() => pickImage(
          (url) => updatePage(pageIndex, { background: { kind: 'image', url, fit: 'cover', position: 'center' } }),
          alert,
        )}
      />

      <Seg label="Columns" value={page.columns ?? doc.pageSetup.columns}
        options={[{ value: 1, label: 'One' }, { value: 2, label: 'Two' }]}
        onChange={(columns) => updatePage(pageIndex, { columns })} />

      {(page.columns ?? doc.pageSetup.columns) === 2 && (
        <Num
          label="Left column share"
          value={Math.round(((page.colRatio?.[0] ?? 1) / ((page.colRatio?.[0] ?? 1) + (page.colRatio?.[1] ?? 1))) * 100)}
          min={15} max={85} step={1} suffix="%"
          onChange={(v) => updatePage(pageIndex, { colRatio: [v, 100 - v] })}
        />
      )}

      <Num label="Margin" value={page.margin ?? doc.pageSetup.margin} min={0} max={2.5} step={0.05}
        onChange={(margin) => updatePage(pageIndex, { margin })} suffix="in" />

      <Toggle label="Hide the page number" value={!!page.hideNumber} onChange={(hideNumber) => updatePage(pageIndex, { hideNumber })} />

      <details className="sect" open={!!frame}>
        <summary>Border around the page</summary>
        <Toggle label="Draw a border" value={!!frame}
          onChange={(v) => updatePage(pageIndex, { frame: v ? { color: '@purple', width: 3, inset: 0.5 } : null })} />
        {frame && (
          <>
            <Swatches label="Color" theme={doc.theme} value={frame.color} onChange={(c) => updatePage(pageIndex, { frame: { ...frame, color: c ?? '@purple' } })} />
            <div className="fld-row">
              <Num label="Thickness" value={frame.width} min={1} max={12} onChange={(width) => updatePage(pageIndex, { frame: { ...frame, width } })} suffix="px" />
              <Num label="Inset" value={frame.inset} min={0} max={2} step={0.05} onChange={(inset) => updatePage(pageIndex, { frame: { ...frame, inset } })} suffix="in" />
            </div>
          </>
        )}
      </details>
    </div>
  );
}
