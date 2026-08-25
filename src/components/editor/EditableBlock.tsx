'use client';

import { useState } from 'react';
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
  const updateBlockProps = useEditor((s) => s.updateBlockProps);
  const duplicateBlock = useEditor((s) => s.duplicateBlock);
  const deleteBlock = useEditor((s) => s.deleteBlock);
  const [dropping, setDropping] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id, data: { type: 'block', block } });

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
          <button
            className="blk-tool" data-drag="true" aria-label="Drag to move"
            {...attributes} {...listeners}
          >⠿</button>
          <button className="blk-tool" aria-label="Duplicate" title="Duplicate"
            onClick={() => duplicateBlock(block.id)}>⧉</button>
          <button className="blk-tool" aria-label="Delete" title="Delete"
            onClick={() => deleteBlock(block.id)}>🗑</button>
        </div>
      )}
    </div>
  );
}
