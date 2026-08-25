'use client';

import { useState } from 'react';
import type { BlockType } from '@/lib/types';
import { BLOCK_LABELS, BLOCK_MENU_ORDER } from '@/lib/doc';
import { useEditor } from '@/lib/store';
import { Overlay } from './Popover';

const HINTS: Record<BlockType, string> = {
  program:      'Heading, description, schedule box',
  richText:     'A paragraph you can style',
  sectionTitle: 'Big centred page heading',
  infoTable:    'Dates / Time / Fee / Location',
  photo:        'Drop or pick an image',
  highlightBox: 'Big text on a colour block',
  labelValue:   'Who: / Date: / Location:',
  qr:           'Scannable link + caption',
  socialRow:    'X and Instagram handles',
  directoryBox: 'Contents with page numbers',
  sidebarBox:   'Staff panel with logo',
  formFields:   'Ruled fill-in lines',
  cover:        'Full-page front cover',
  spacer:       'Blank vertical gap',
};

/** The floating "+" that adds a block to the page being viewed. */
export function AddBlockButton({ pageIndex }: { pageIndex: number }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const addBlock = useEditor((s) => s.addBlock);

  return (
    <>
      <button
        className="btn btn-sm"
        style={{ position: 'absolute', right: 8, bottom: 8, zIndex: 15 }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        + Add block
      </button>
      <AddBlockMenu
        open={!!anchor}
        anchor={anchor}
        onClose={() => setAnchor(null)}
        onPick={(t) => { addBlock(pageIndex, t); setAnchor(null); }}
      />
    </>
  );
}

export function AddBlockMenu({ open, anchor, onClose, onPick }: {
  open: boolean; anchor?: HTMLElement | null; onClose: () => void; onPick: (t: BlockType) => void;
}) {
  return (
    <Overlay open={open} onClose={onClose} anchor={anchor} width={380} title="Add a block">
      <div className="addgrid">
        {BLOCK_MENU_ORDER.map((t) => (
          <button key={t} type="button" onClick={() => onPick(t)}>
            <b>{BLOCK_LABELS[t]}</b>
            <span>{HINTS[t]}</span>
          </button>
        ))}
      </div>
    </Overlay>
  );
}
