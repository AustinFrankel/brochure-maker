/**
 * Creates the bundled Fall 2025 brochure in whichever store is configured.
 *
 *   npm run seed                     # local .data/brochures.json
 *   DATABASE_URL=… npm run seed      # Neon / Postgres
 */
import 'dotenv/config';
import { store } from '../src/lib/db';
import { cloneDoc } from '../src/lib/doc';
import { fall2025 } from '../src/lib/seed/fall-2025';

async function main() {
  const s = store();
  const existing = await s.list();
  const title = process.argv[2] ?? 'Fall 2025 Activities Brochure';

  if (existing.some((b) => b.title === title)) {
    console.log(`"${title}" already exists — nothing to do.`);
    return;
  }

  const rec = await s.create(title, cloneDoc(fall2025(), title));
  console.log(`Created "${rec.title}" (${rec.doc.pages.length} pages)`);
  console.log(`  edit:  /edit/${rec.id}`);
  console.log(`  print: /print/${rec.id}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
