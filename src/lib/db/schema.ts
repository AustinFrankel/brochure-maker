import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const brochures = pgTable('brochures', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  doc: jsonb('doc').notNull(),
  thumbUrl: text('thumb_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  /** Soft delete: the app is open to anyone with the URL, so nothing is ever
   *  destroyed by a stray tap. */
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const brochureVersions = pgTable('brochure_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  brochureId: uuid('brochure_id').notNull().references(() => brochures.id, { onDelete: 'cascade' }),
  doc: jsonb('doc').notNull(),
  label: text('label'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
