/**
 * Where brochures live.
 *
 * Two stores, chosen at runtime:
 *
 *  - **Supabase** when the project URL and key are set. This is the deployed
 *    path: everything is in one Postgres table, so a brochure edited on a laptop
 *    is the same brochure opened on an iPad a minute later.
 *  - **A local JSON file** otherwise, so `npm run dev` works the moment you
 *    clone the repo, with no account to create and nothing to configure.
 *
 * Both satisfy the same `Store` interface, and nothing above this file knows or
 * cares which one is in use.
 *
 * There is no authentication anywhere here. That is deliberate: this is an
 * internal tool for a small group who all share the same brochures, and a login
 * wall would cost them more than it protects.
 *
 * NOTE: no `server-only` guard, because `scripts/seed.ts` imports this from
 * Node. The
 * `node:fs` import already keeps it out of any client bundle.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { BrochureMeta, Doc } from '@/lib/types';
import { migrate } from '@/lib/doc';

export interface StoredBrochure extends BrochureMeta {
  doc: Doc;
}

export interface Store {
  list(): Promise<BrochureMeta[]>;
  get(id: string): Promise<StoredBrochure | null>;
  create(title: string, doc: Doc): Promise<StoredBrochure>;
  update(id: string, patch: { title?: string; doc?: Doc }): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  snapshot(id: string, label: string): Promise<void>;
  versions(id: string): Promise<{ id: string; label: string | null; createdAt: string }[]>;
  version(id: string, versionId: string): Promise<Doc | null>;
}

/* ------------------------------------------------------------------ Supabase */

/**
 * Read on use, not at import. A script that loads a .env file does so in its own
 * module body, which runs after its imports have already been evaluated, so
 * capturing these into constants here meant a seed script silently wrote to the
 * local JSON file while the app was talking to Supabase.
 */
const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabaseKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

export const hasSupabase = () => Boolean(supabaseUrl() && supabaseKey());

let client: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  client ??= createClient(supabaseUrl(), supabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

interface Row {
  id: string;
  title: string;
  doc: Doc;
  thumb_url: string | null;
  created_at: string;
  updated_at: string;
}

const toMeta = (r: Omit<Row, 'doc'> & { doc?: Doc }, pageCount: number): BrochureMeta => ({
  id: r.id,
  title: r.title,
  thumbUrl: r.thumb_url,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  pageCount,
});

function supabaseStore(): Store {
  const db = supabase();
  const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

  return {
    async list() {
      const { data, error } = await db
        .from('brochures')
        .select('id,title,thumb_url,created_at,updated_at,doc')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });
      fail(error);
      return (data ?? []).map((r) => toMeta(r as Row, (r as Row).doc?.pages?.length ?? 0));
    },

    async get(id) {
      const { data, error } = await db
        .from('brochures').select('*').eq('id', id).is('deleted_at', null).maybeSingle();
      if (error && error.code !== 'PGRST116') fail(error);
      if (!data) return null;
      const r = data as Row;
      const doc = migrate(r.doc);
      return { ...toMeta(r, doc.pages.length), doc };
    },

    async create(title, doc) {
      const { data, error } = await db
        .from('brochures').insert({ title, doc }).select().single();
      fail(error);
      const r = data as Row;
      return { ...toMeta(r, doc.pages.length), doc };
    },

    async update(id, patch) {
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.doc !== undefined) row.doc = patch.doc;
      fail((await db.from('brochures').update(row).eq('id', id)).error);
    },

    async softDelete(id) {
      fail((await db.from('brochures')
        .update({ deleted_at: new Date().toISOString() }).eq('id', id)).error);
    },

    async restore(id) {
      fail((await db.from('brochures').update({ deleted_at: null }).eq('id', id)).error);
    },

    async snapshot(id, label) {
      const { data } = await db.from('brochures').select('doc').eq('id', id).maybeSingle();
      if (!data) return;
      await db.from('brochure_versions').insert({ brochure_id: id, doc: (data as Row).doc, label });
    },

    async versions(id) {
      const { data, error } = await db
        .from('brochure_versions')
        .select('id,label,created_at')
        .eq('brochure_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      fail(error);
      return (data ?? []).map((v) => ({
        id: v.id as string,
        label: v.label as string | null,
        createdAt: v.created_at as string,
      }));
    },

    async version(id, versionId) {
      const { data } = await db
        .from('brochure_versions').select('doc')
        .eq('id', versionId).eq('brochure_id', id).maybeSingle();
      return data ? migrate((data as { doc: Doc }).doc) : null;
    },
  };
}

/* --------------------------------------------------------------- local file */

interface LocalFile {
  brochures: (BrochureMeta & { doc: Doc; deletedAt: string | null })[];
  versions: { id: string; brochureId: string; doc: Doc; label: string | null; createdAt: string }[];
}

const FILE = path.join(process.cwd(), '.data', 'brochures.json');
const rid = () => globalThis.crypto.randomUUID();

async function read(): Promise<LocalFile> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as LocalFile;
  } catch {
    return { brochures: [], versions: [] };
  }
}

async function write(d: LocalFile) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(d, null, 2));
}

function localStore(): Store {
  return {
    async list() {
      const d = await read();
      return d.brochures
        .filter((b) => !b.deletedAt)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((b) => ({
          id: b.id, title: b.title, thumbUrl: b.thumbUrl,
          createdAt: b.createdAt, updatedAt: b.updatedAt,
          pageCount: b.doc.pages.length,
        }));
    },

    async get(id) {
      const d = await read();
      const b = d.brochures.find((x) => x.id === id && !x.deletedAt);
      if (!b) return null;
      const doc = migrate(b.doc);
      return { ...b, doc, pageCount: doc.pages.length };
    },

    async create(title, doc) {
      const d = await read();
      const now = new Date().toISOString();
      const rec = {
        id: rid(), title, doc, thumbUrl: null,
        createdAt: now, updatedAt: now, pageCount: doc.pages.length, deletedAt: null,
      };
      d.brochures.unshift(rec);
      await write(d);
      return rec;
    },

    async update(id, patch) {
      const d = await read();
      const b = d.brochures.find((x) => x.id === id);
      if (!b) return;
      if (patch.title !== undefined) b.title = patch.title;
      if (patch.doc !== undefined) b.doc = patch.doc;
      b.updatedAt = new Date().toISOString();
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
      d.versions.unshift({
        id: rid(), brochureId: id, doc: b.doc, label,
        createdAt: new Date().toISOString(),
      });
      d.versions = d.versions.slice(0, 400);
      await write(d);
    },

    async versions(id) {
      const d = await read();
      return d.versions
        .filter((v) => v.brochureId === id)
        .map(({ id: vid, label, createdAt }) => ({ id: vid, label, createdAt }));
    },

    async version(id, versionId) {
      const d = await read();
      const v = d.versions.find((x) => x.id === versionId && x.brochureId === id);
      return v ? migrate(v.doc) : null;
    },
  };
}

/* -------------------------------------------------------------------- choose */

export function usingLocalStore() {
  return !hasSupabase();
}

export function store(): Store {
  return hasSupabase() ? supabaseStore() : localStore();
}
