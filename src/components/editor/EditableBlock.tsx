'use client';

import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Block, Theme } from '@/lib/types';
import { BlockView } from '@/components/render/BlockView';
import { useEditor } from '@/lib/store';
import { uploadImage } from '@/lib/upload';

/**
 * A block on the canvas: click to select (which also makes its text typeable),
 * drag by the handle to reorder, drop an image file on it to fill a photo.
 *
 * Dragging is handle-only so that selecting text inside a block never starts a
 * drag — important on touch, where the two gestures are otherwise identical.
 */
export function EditableBlock({ block, theme }: { block: Block; theme: Theme }) {
  const selected = useEditor((s) => s.selectedBlockId === block.id);
  const selectBlock = useEditor((s) => s.selectBlock);
  const updateBlock = useEditor((s) => s.updateBlock);
  const updateBlockProps = useEditor((s) => s.updateBlockProps);
  const duplicateBlock = useEditor((s) => s.duplicateBlock);
  const deleteBlock = useEditor((s) => s.deleteBlock);
  const [dropping, setDropping] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id, data: { type: 'block', block }, disabled: !!block.pos });

  // A placed block is dragged directly to new coordinates rather than reordered
  // in a list, so it gets its own pointer handling instead of dnd-kit's.
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const onPlacedDragStart = (e: React.PointerEvent) => {
    if (!block.pos) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: block.pos.x, y: block.pos.y };
  };
  const onPlacedDragMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !block.pos) return;
    // The canvas is scaled, so screen pixels must be converted back to inches
    // through the page's own on-screen width.
    const page = (e.currentTarget as HTMLElement).closest('.rb-page') as HTMLElement | null;
    const pxPerInch = (page?.getBoundingClientRect().width ?? 816) / 8.5;
    updateBlock(block.id, {
      pos: {
        ...block.pos,
        x: Math.round((d.x + (e.clientX - d.px) / pxPerInch) * 1000) / 1000,
        y: Math.round((d.y + (e.clientY - d.py) / pxPerInch) * 1000) / 1000,
      },
    });
  };
  const onPlacedDragEnd = () => { drag.current = null; };

  const acceptsImage = block.type === 'photo' || block.type === 'cover';

  const onDrop = async (e: React.DragEvent) => {
    setDropping(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      const url = await uploadImage(file);
      if (block.type === 'cover') updateBlockProps(block.id, { photo: { url, focal: 'center' } });
      else if (block.type === 'photo') updateBlockProps(block.id, { url });
      else updateBlockProps(block.id, { url });
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`blk${dropping ? ' col-drop' : ''}`}
      data-selected={selected}
      data-dragging={isDragging}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        ...(isDragging ? { zIndex: 30 } : {}),
      }}
      // Selecting on pointer-down, then letting the event through, so a second
      // click inside a selected block places the caret instead of reselecting.
      onPointerDown={() => { if (!selected) selectBlock(block.id); }}
      onDragOver={acceptsImage ? (e) => { e.preventDefault(); setDropping(true); } : undefined}
      onDragLeave={acceptsImage ? () => setDropping(false) : undefined}
      onDrop={acceptsImage ? onDrop : undefined}
    >
      <BlockView
        block={block}
        theme={theme}
        ed={{ editing: selected, setProps: (patch) => updateBlockProps(block.id, patch) }}
      />
      <div className="blk-hit" />

      {selected && (
        <div className="blk-tools" onPointerDown={(e) => e.stopPropagation()}>
          {block.pos ? (
            <button
              className="blk-tool" data-drag="true" aria-label="Drag to move"
              onPointerDown={onPlacedDragStart}
              onPointerMove={onPlacedDragMove}
              onPointerUp={onPlacedDragEnd}
              onPointerCancel={onPlacedDragEnd}
            >⠿</button>
          ) : (
            <button
              className="blk-tool" data-drag="true" aria-label="Drag to move"
              {...attributes} {...listeners}
            >⠿</button>
          )}
          <button className="blk-tool" aria-label="Duplicate" title="Duplicate"
            onClick={() => duplicateBlock(block.id)}>⧉</button>
          <button className="blk-tool" aria-label="Delete" title="Delete"
            onClick={() => deleteBlock(block.id)}>🗑</button>
        </div>
      )}
    </div>
  );
}
