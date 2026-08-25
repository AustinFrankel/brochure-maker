'use client';

import { create } from 'zustand';
import { temporal } from 'zundo';
import { useStore } from 'zustand';
import type { Block, BlockType, Doc, Fill, Page, Theme, Typo } from './types';
import { cloneBlock, clonePage, createBlock, createPage, emptyDoc, findBlock } from './doc';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface EditorState {
  doc: Doc;
  selectedBlockId: string | null;
  selectedPageIndex: number;
  saveState: SaveState;
  overflowPages: Record<string, boolean>;

  /** Id of the brochure currently in the store, or null before the first load. */
  loadedId: string | null;
  load: (id: string, doc: Doc) => void;
  setSaveState: (s: SaveState) => void;
  selectBlock: (id: string | null) => void;
  selectPage: (i: number) => void;
  setOverflow: (pageId: string, v: boolean) => void;

  setTitle: (t: string) => void;
  setTheme: (patch: Partial<Theme>) => void;
  setPalette: (token: string, value: string) => void;
  setPageSetup: (patch: Partial<Doc['pageSetup']>) => void;

  addPage: (afterIndex?: number) => void;
  duplicatePage: (index: number) => void;
  deletePage: (index: number) => void;
  movePage: (from: number, to: number) => void;
  updatePage: (index: number, patch: Partial<Page>) => void;

  addBlock: (pageIndex: number, type: BlockType, atIndex?: number) => void;
  insertBlock: (pageIndex: number, block: Block, atIndex?: number) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  updateBlockProps: (id: string, patch: Record<string, unknown>) => void;
  setBlockTypo: (id: string, patch: Typo) => void;
  setBlockBackground: (id: string, fill: Fill) => void;
  duplicateBlock: (id: string) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, toPageIndex: number, toIndex: number) => void;
}

/** Only the document participates in undo/redo — selection and save status don't. */
const trackedKeys = ['doc'] as const;

export const useEditor = create<EditorState>()(
  temporal(
    (set, get) => ({
      doc: emptyDoc(),
      loadedId: null,
      selectedBlockId: null,
      selectedPageIndex: 0,
      saveState: 'idle',
      overflowPages: {},

      load: (id, doc) => set({ doc, loadedId: id, selectedBlockId: null, selectedPageIndex: 0, saveState: 'idle' }),
      setSaveState: (saveState) => set({ saveState }),
      selectBlock: (selectedBlockId) => set({ selectedBlockId }),
      selectPage: (selectedPageIndex) => set({ selectedPageIndex }),
      setOverflow: (pageId, v) =>
        set((s) => (s.overflowPages[pageId] === v ? s : { overflowPages: { ...s.overflowPages, [pageId]: v } })),

      setTitle: (title) => set((s) => ({ doc: { ...s.doc, title } })),
      setTheme: (patch) => set((s) => ({ doc: { ...s.doc, theme: { ...s.doc.theme, ...patch } } })),
      setPalette: (token, value) =>
        set((s) => ({ doc: { ...s.doc, theme: { ...s.doc.theme, palette: { ...s.doc.theme.palette, [token]: value } } } })),
      setPageSetup: (patch) => set((s) => ({ doc: { ...s.doc, pageSetup: { ...s.doc.pageSetup, ...patch } } })),

      addPage: (afterIndex) => set((s) => {
        const pages = [...s.doc.pages];
        const at = afterIndex == null ? pages.length : afterIndex + 1;
        pages.splice(at, 0, createPage());
        return { doc: { ...s.doc, pages }, selectedPageIndex: at, selectedBlockId: null };
      }),
      duplicatePage: (index) => set((s) => {
        const pages = [...s.doc.pages];
        pages.splice(index + 1, 0, clonePage(pages[index]));
        return { doc: { ...s.doc, pages }, selectedPageIndex: index + 1 };
      }),
      deletePage: (index) => set((s) => {
        if (s.doc.pages.length <= 1) return s;
        const pages = s.doc.pages.filter((_, i) => i !== index);
        return { doc: { ...s.doc, pages }, selectedPageIndex: Math.max(0, Math.min(index, pages.length - 1)), selectedBlockId: null };
      }),
      movePage: (from, to) => set((s) => {
        const pages = [...s.doc.pages];
        const [p] = pages.splice(from, 1);
        pages.splice(to, 0, p);
        return { doc: { ...s.doc, pages }, selectedPageIndex: to };
      }),
      updatePage: (index, patch) => set((s) => {
        const pages = s.doc.pages.map((p, i) => (i === index ? { ...p, ...patch } : p));
        return { doc: { ...s.doc, pages } };
      }),

      addBlock: (pageIndex, type, atIndex) => {
        const block = createBlock(type);
        get().insertBlock(pageIndex, block, atIndex);
      },
      insertBlock: (pageIndex, block, atIndex) => set((s) => {
        const pages = s.doc.pages.map((p, i) => {
          if (i !== pageIndex) return p;
          const blocks = [...p.blocks];
          blocks.splice(atIndex == null ? blocks.length : atIndex, 0, block);
          return { ...p, blocks };
        });
        return { doc: { ...s.doc, pages }, selectedBlockId: block.id, selectedPageIndex: pageIndex };
      }),
      updateBlock: (id, patch) => set((s) => ({
        doc: {
          ...s.doc,
          pages: s.doc.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
          })),
        },
      })),
      updateBlockProps: (id, patch) => set((s) => ({
        doc: {
          ...s.doc,
          pages: s.doc.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) =>
              b.id === id ? ({ ...b, props: { ...(b.props as object), ...patch } } as unknown as Block) : b),
          })),
        },
      })),
      setBlockTypo: (id, patch) => set((s) => ({
        doc: {
          ...s.doc,
          pages: s.doc.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) => (b.id === id ? { ...b, typo: { ...b.typo, ...patch } } : b)),
          })),
        },
      })),
      setBlockBackground: (id, background) => get().updateBlock(id, { background }),
      duplicateBlock: (id) => set((s) => {
        const hit = findBlock(s.doc, id);
        if (!hit) return s;
        const copy = cloneBlock(hit.block);
        const pages = s.doc.pages.map((p, i) => {
          if (i !== hit.pageIndex) return p;
          const blocks = [...p.blocks];
          blocks.splice(hit.blockIndex + 1, 0, copy);
          return { ...p, blocks };
        });
        return { doc: { ...s.doc, pages }, selectedBlockId: copy.id };
      }),
      deleteBlock: (id) => set((s) => ({
        doc: { ...s.doc, pages: s.doc.pages.map((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) })) },
        selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
      })),
      moveBlock: (id, toPageIndex, toIndex) => set((s) => {
        const hit = findBlock(s.doc, id);
        if (!hit) return s;
        const pages = s.doc.pages.map((p) => ({ ...p, blocks: [...p.blocks] }));
        pages[hit.pageIndex].blocks.splice(hit.blockIndex, 1);
        const clamped = Math.max(0, Math.min(toIndex, pages[toPageIndex].blocks.length));
        pages[toPageIndex].blocks.splice(clamped, 0, hit.block);
        return { doc: { ...s.doc, pages }, selectedPageIndex: toPageIndex };
      }),
    }),
    {
      limit: 100,
      partialize: (s) => Object.fromEntries(trackedKeys.map((k) => [k, s[k]])) as Pick<EditorState, 'doc'>,
      // Coalesce rapid typing into one undo step per ~600ms pause.
      handleSet: (handleSet) => {
        let t: ReturnType<typeof setTimeout> | undefined;
        return ((...args: Parameters<typeof handleSet>) => {
          clearTimeout(t);
          t = setTimeout(() => handleSet(...args), 600);
        }) as typeof handleSet;
      },
    },
  ),
);

/** Undo/redo state for the toolbar. */
export function useTemporal() {
  const undo = () => useEditor.temporal.getState().undo();
  const redo = () => useEditor.temporal.getState().redo();
  const clear = () => useEditor.temporal.getState().clear();
  const pastStates = useStore(useEditor.temporal, (s) => s.pastStates.length);
  const futureStates = useStore(useEditor.temporal, (s) => s.futureStates.length);
  return { undo, redo, clear, canUndo: pastStates > 0, canRedo: futureStates > 0 };
}

export function useSelectedBlock(): Block | null {
  return useEditor((s) => {
    if (!s.selectedBlockId) return null;
    return findBlock(s.doc, s.selectedBlockId)?.block ?? null;
  });
}
