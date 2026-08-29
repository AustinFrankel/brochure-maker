/**
 * Puts the three seasons into whichever store is configured, so a fresh
 * deployment opens with real brochures rather than an empty page.
 *
 *   npm run seed            # local .data/brochures.json
 *   npm run seed -- --force # add them again even if they are already there
 *
 * With the Supabase environment variables set, this seeds the shared database.
 */
import { config } from 'dotenv';
import { store } from '../src/lib/db';

// Next reads .env.local; plain `dotenv/config` does not. Without this the seed
// quietly writes to the local JSON file while the app is talking to Supabase,
// and the brochures never appear.
for (const f of ['.env.local', '.env']) config({ path: f, quiet: true });
import { TEMPLATES, buildTemplate } from '../src/lib/templates';

/** The starters, newest season first, matching the home page order. */
const SEED = ['winter-2025-2026', 'spring-summer-2026', 'fall-2025'];

async function main() {
  const s = store();
  const force = process.argv.includes('--force');
  const existing = await s.list();

  for (const id of SEED) {
    const info = TEMPLATES.find((t) => t.id === id);
    if (!info) continue;

    if (!force && existing.some((b) => b.title === info.name)) {
      console.log(`· ${info.name}: already there, skipping`);
      continue;
    }

    const doc = buildTemplate(id, info.name);
    const rec = await s.create(info.name, doc);
    console.log(`✓ ${rec.title}: ${rec.doc.pages.length} pages  /edit/${rec.id}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
