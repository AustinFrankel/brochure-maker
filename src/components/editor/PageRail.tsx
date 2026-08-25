'use client';

import {
  DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Doc, Page } from '@/lib/types';
import { PageSurface } from '@/components/render/PageSurface';
import { useEditor } from '@/lib/store';

const THUMB_W = 128;
const SCALE = THUMB_W / 816;

function Thumb({ doc, page, index, active, onSelect, overflowing }: {
  doc: Doc; page: Page; index: number; active: boolean; onSelect: () => void; overflowing: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id, data: { type: 'page' } });

  return (
    <div
      ref={setNodeRef}
      className="thumb"
      data-active={active}
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      onClick={onSelect}
    >
      <div className="thumb-scale" style={{ transform: `scale(${SCALE})`, width: 816, height: 1056 }}>
        <PageSurface doc={doc} page={page} index={index} />
      </div>
      <div className="thumb-drag" {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>⠿</div>
      {overflowing && <div className="thumb-warn" title="Content runs off this page">⚠</div>}
      <div className="thumb-num">{index + 1}</div>
    </div>
  );
}

/** Page thumbnails: tap to jump, drag the handle to reorder. */
export function PageRail({ doc, onJump }: { doc: Doc; onJump: (i: number) => void }) {
  const selected = useEditor((s) => s.selectedPageIndex);
  const movePage = useEditor((s) => s.movePage);
  const addPage = useEditor((s) => s.addPage);
  const overflow = useEditor((s) => s.overflowPages);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = doc.pages.findIndex((p) => p.id === active.id);
    const to = doc.pages.findIndex((p) => p.id === over.id);
    if (from >= 0 && to >= 0) movePage(from, to);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={doc.pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        {doc.pages.map((p, i) => (
          <Thumb
            key={p.id} doc={doc} page={p} index={i}
            active={i === selected}
            overflowing={!!overflow[p.id]}
            onSelect={() => onJump(i)}
          />
        ))}
      </SortableContext>
      <button className="btn btn-sm" style={{ width: '100%' }} onClick={() => addPage(doc.pages.length - 1)}>
        + Page
      </button>
    </DndContext>
  );
}
