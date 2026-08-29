'use client';

import { useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, closestCenter,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Block, Doc } from '@/lib/types';
import { PageSurface } from '@/components/render/PageSurface';
import { BlockView } from '@/components/render/BlockView';
import { useEditor } from '@/lib/store';
import { EditableBlock } from './EditableBlock';
import { AddBlockButton } from './AddBlockMenu';

/**
 * The editor canvas: every page at true 8.5x11 proportions, scaled to fit the
 * viewport. This is the same `PageSurface` the PDF uses, so what you see here is
 * what prints.
 */
export function Canvas({ doc, zoom }: { doc: Doc; zoom: number }) {
  const selectBlock = useEditor((s) => s.selectBlock);
  const selectPage = useEditor((s) => s.selectPage);
  const moveBlock = useEditor((s) => s.moveBlock);
  const updateBlock = useEditor((s) => s.updateBlock);
  const setOverflow = useEditor((s) => s.setOverflow);
  const overflow = useEditor((s) => s.overflowPages);
  const [dragging, setDragging] = useState<Block | null>(null);

  // A short press-and-hold before a touch drag starts, so scrolling the page on
  // an iPad never picks a block up by accident.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const allIds = useMemo(() => doc.pages.flatMap((p) => p.blocks.map((b) => b.id)), [doc.pages]);

  const onDragStart = (e: DragStartEvent) => {
    setDragging((e.active.data.current as { block?: Block })?.block ?? null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const from = locate(doc, String(active.id));
    const to = locate(doc, String(over.id));
    if (!from || !to) return;

    // Dropping onto a block in the other column moves it there too.
    const target = doc.pages[to.pageIndex].blocks[to.blockIndex];
    if (target.col !== from.block.col && target.span === 'column' && from.block.span === 'column') {
      updateBlock(from.block.id, { col: target.col ?? 0 });
    }
    moveBlock(String(active.id), to.pageIndex, to.blockIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        {doc.pages.map((page, i) => (
          <div
            key={page.id}
            className="page-wrap"
            style={{ width: 816 * zoom }}
            onPointerDown={(e) => {
              selectPage(i);
              // Only a click on bare page clears the selection. Testing the
              // target beats relying on a child calling stopPropagation, which
              // it cannot do once the block is selected and wants the caret.
              if (!(e.target as HTMLElement).closest('.blk')) selectBlock(null);
            }}
          >
            <div className="page-label only-wide">
              <span>Page {i + 1}</span>
            </div>
            {overflow[page.id] && (
              <div className="page-overflow">
                ⚠ Content runs past the bottom of this page. Move a block to the next page, or shorten the text.
              </div>
            )}
            <div style={{ width: 816, transform: `scale(${zoom})`, transformOrigin: 'top left', height: 1056 * zoom }}>
              <PageSurface
                doc={doc}
                page={page}
                index={i}
                className="page-shadow"
                onOverflow={(v) => setOverflow(page.id, v)}
                renderBlock={(b) => <EditableBlock key={b.id} block={b} theme={doc.theme} />}
              >
                <AddBlockButton pageIndex={i} />
              </PageSurface>
            </div>
          </div>
        ))}
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div style={{ width: 340, opacity: 0.9, pointerEvents: 'none' }}>
            <BlockView block={dragging} theme={doc.theme} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function locate(doc: Doc, id: string) {
  for (let pi = 0; pi < doc.pages.length; pi++) {
    const bi = doc.pages[pi].blocks.findIndex((b) => b.id === id);
    if (bi >= 0) return { pageIndex: pi, blockIndex: bi, block: doc.pages[pi].blocks[bi] };
  }
  return null;
}
