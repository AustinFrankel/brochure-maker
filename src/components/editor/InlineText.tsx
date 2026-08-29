'use client';

import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import { clean } from '@/lib/sanitize';
import { RichText } from '@/components/render/RichText';

const EXTENSIONS = [
  // StarterKit already provides underline, so it is not listed separately.
  StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false, link: false }),
  TextStyle,
  Color,
  FontSize,
  TextAlign.configure({ types: ['paragraph'] }),
];

type Props = {
  html: string;
  onChange: (html: string) => void;
  className?: string;
  style?: React.CSSProperties;
  inline?: boolean;
};

/**
 * A live Tiptap instance. Mounted only while its block is selected, since one
 * editor per paragraph across fourteen pages would make the canvas crawl, and torn
 * down with the component, so nothing ever touches a destroyed editor.
 */
function LiveText({ html, onChange, className, style, inline }: Props) {
  // The HTML this editor last emitted. Written only from `onUpdate`, never from
  // a render or an effect keyed on `html`, or it would always equal the
  // incoming prop and external changes (undo, a theme swap) could never land.
  const lastEmitted = useRef<string | null>(null);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: clean(html),
    editable: true,
    immediatelyRender: false,
    editorProps: { attributes: { class: `rb-rt${inline ? ' rb-rt-inline' : ''} rb-editing` } },
    onUpdate: ({ editor: e }) => {
      const next = e.getHTML();
      lastEmitted.current = next;
      onChange(next);
    },
  });

  // Pull in changes from elsewhere (undo, a theme swap, the inspector) without
  // stomping on what the user is typing.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (html === lastEmitted.current) return;        // an echo of our own edit
    if (html === editor.getHTML()) return;           // already in sync
    const { from, to } = editor.state.selection;
    editor.commands.setContent(clean(html), { emitUpdate: false });
    // Keep the caret where it was when the change came from elsewhere.
    const max = editor.state.doc.content.size;
    if (from <= max && to <= max) editor.commands.setTextSelection({ from, to });
  }, [editor, html]);

  if (!editor) return <RichText html={html} className={className} style={style} inline={inline} />;
  return <EditorContent editor={editor} className={className} style={style} />;
}

/** Rich text edited where it sits on the page. */
export function InlineText({ html, active, onChange, className, style, inline }: Props & { active: boolean }) {
  if (!active) return <RichText html={html} className={className} style={style} inline={inline} />;
  return <LiveText html={html} onChange={onChange} className={className} style={style} inline={inline} />;
}

/**
 * Single-line plain text edited in place (headings, captions, table cells).
 * contentEditable rather than an input, so the text keeps the document's exact
 * font and size while you type.
 */
export function PlainEdit({ value, active, onChange, className, style, placeholder, as: Tag = 'div' }: {
  value: string;
  active: boolean;
  onChange: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  as?: 'div' | 'span';
}) {
  const ref = useRef<HTMLElement>(null);

  // `active` is a dependency because switching into edit mode swaps this node
  // for a childless contentEditable, so the text has to be written back in.
  useEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== value && document.activeElement !== el) el.textContent = value;
  }, [value, active]);

  if (!active) {
    return <Tag className={className} style={style}>{value || <span style={{ opacity: 0.35 }}>{placeholder}</span>}</Tag>;
  }
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLSpanElement>}
      className={`${className ?? ''} rb-editing`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={(e) => onChange((e.currentTarget as HTMLElement).textContent ?? '')}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } }}
    />
  );
}
