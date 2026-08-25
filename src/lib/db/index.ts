// NOTE: no `server-only` guard here — `scripts/seed.ts` imports this module
// directly from Node. The `node:fs` import already makes a client bundle fail.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import type { BrochureMeta, Doc } from '../types';
import { migrate } from '../doc';
import { brochures, brochureVersions } from './schema';

export interface BrochureRecord extends BrochureMeta { doc: Doc }

export interface Store {
  list(): Promise<BrochureMeta[]>;
  get(id: string): Promise<BrochureRecord | null>;
  create(title: string, doc: Doc): Promise<BrochureRecord>;
  update(id: string, patch: { title?: string; doc?: Doc; thumbUrl?: string }): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  snapshot(id: string, label: string): Promise<void>;
  versions(id: string): Promise<{ id: string; label: string | null; createdAt: string }[]>;
  version(id: string, versionId: string): Promise<Doc | null>;
}

const meta = (r: { id: string; title: string; doc: unknown; thumbUrl?: string | null; createdAt: Date | string; updatedAt: Date | string }): BrochureMeta => ({
  id: r.id,
  title: r.title,
  createdAt: new Date(r.createdAt).toISOString(),
  updatedAt: new Date(r.updatedAt).toISOString(),
  pageCount: (r.doc as Doc)?.pages?.length ?? 0,
  thumbUrl: r.thumbUrl ?? null,
});

// --------------------------------------------------------------- Neon / Postgres

function pgStore(url: string): Store {
  const db = drizzle(neon(url));

  return {
    async list() {
      const rows = await db.select().from(brochures).where(isNull(brochures.deletedAt)).orderBy(desc(brochures.updatedAt));
      return rows.map(meta);
    },
    async get(id) {
      const [row] = await db.select().from(brochures).where(and(eq(brochures.id, id), isNull(brochures.deletedAt))).limit(1);
      return row ? { ...meta(row), doc: migrate(row.doc) } : null;
    },
    async create(title, doc) {
      const [row] = await db.insert(brochures).values({ title, doc }).returning();
      return { ...meta(row), doc: migrate(row.doc) };
    },
    async update(id, patch) {
      await db.update(brochures)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(brochures.id, id));
    },
    async softDelete(id) { await db.update(brochures).set({ deletedAt: new Date() }).where(eq(brochures.id, id)); },
    async restore(id) { await db.update(brochures).set({ deletedAt: null }).where(eq(brochures.id, id)); },
    async snapshot(id, label) {
      const [row] = await db.select().from(brochures).where(eq(brochures.id, id)).limit(1);
      if (row) await db.insert(brochureVersions).values({ brochureId: id, doc: row.doc, label });
    },
    async versions(id) {
      const rows = await db.select().from(brochureVersions)
        .where(eq(brochureVersions.brochureId, id)).orderBy(desc(brochureVersions.createdAt)).limit(50);
      return rows.map((r) => ({ id: r.id, label: r.label, createdAt: new Date(r.createdAt).toISOString() }));
    },
    async version(id, versionId) {
      const [row] = await db.select().from(brochureVersions).where(eq(brochureVersions.id, versionId)).limit(1);
      return row && row.brochureId === id ? migrate(row.doc) : null;
    },
  };
}

// --------------------------------------------------------- Local JSON fallback
//
// So `npm run dev` works the moment you clone the repo, before Neon is wired up.
// Never used in production: `DATABASE_URL` is always set on Vercel.

interface LocalFile {
  brochures: (BrochureMeta & { doc: Doc; deletedAt: string | null })[];
  versions: { id: string; brochureId: string; doc: Doc; label: string | null; createdAt: string }[];
}

function localStore(): Store {
  const file = path.join(process.cwd(), '.data', 'brochures.json');
  const read = async (): Promise<LocalFile> => {
    try { return JSON.parse(await fs.readFile(file, 'utf8')); }
    catch { return { brochures: [], versions: [] }; }
  };
  const write = async (d: LocalFile) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(d, null, 2));
  };
  const rid = () => globalThis.crypto.randomUUID();

  return {
    async list() {
      const d = await read();
      return d.brochures.filter((b) => !b.deletedAt)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        // `doc` and `deletedAt` are stripped: the list only carries metadata.
        .map((b) => ({
          id: b.id, title: b.title, thumbUrl: b.thumbUrl,
          createdAt: b.createdAt, updatedAt: b.updatedAt,
          pageCount: b.doc.pages.length,
        }));
    },
    async get(id) {
      const d = await read();
      const b = d.brochures.find((x) => x.id === id && !x.deletedAt);
      return b ? { ...b, doc: migrate(b.doc), pageCount: b.doc.pages.length } : null;
    },
    async create(title, doc) {
      const d = await read();
      const now = new Date().toISOString();
      const rec = { id: rid(), title, doc, thumbUrl: null, createdAt: now, updatedAt: now, pageCount: doc.pages.length, deletedAt: null };
      d.brochures.push(rec);
      await write(d);
      return rec;
    },
    async update(id, patch) {
      const d = await read();
      const b = d.brochures.find((x) => x.id === id);
      if (!b) return;
      Object.assign(b, patch, { updatedAt: new Date().toISOString() });
      await write(d);
    },
    async softDelete(id) {
      const d = await read();
      const b = d.brochures.find((x) => x.id === id);
      if (b) { b.deletedAt = new Date().toISOString(); await write(d); }
    },
    async restore(id) {
      const d = await read();
      const b = d.brochures.find((x) => x.id === id);
      if (b) { b.deletedAt = null; await write(d); }
    },
    async snapshot(id, label) {
      const d = await read();
      const b = d.brochures.find((x) => x.id === id);
      if (!b) return;
      d.versions.push({ id: rid(), brochureId: id, doc: b.doc, label, createdAt: new Date().toISOString() });
      d.versions = d.versions.slice(-500);
      await write(d);
    },
    async versions(id) {
      const d = await read();
      return d.versions.filter((v) => v.brochureId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50)
        .map(({ id: vid, label, createdAt }) => ({ id: vid, label, createdAt }));
    },
    async version(id, versionId) {
      const d = await read();
      const v = d.versions.find((x) => x.id === versionId && x.brochureId === id);
      return v ? migrate(v.doc) : null;
    },
  };
}

let cached: Store | null = null;

export function store(): Store {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  cached = url ? pgStore(url) : localStore();
  return cached;
}

export const usingLocalStore = () => !process.env.DATABASE_URL;
