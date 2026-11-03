import { AnyPgColumn, text, unique, uuid } from 'drizzle-orm/pg-core';
import { catalogSchema, slugChecks } from './catalog.schema';

export const categories = catalogSchema.table(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'restrict',
    }),

    name: text('name').notNull(),
    slug: text('slug').notNull(),
  },
  (t) => [
    ...slugChecks('categories', t.slug),
    unique('categories_parent_slug_unique')
      .on(t.parentId, t.slug)
      .nullsNotDistinct(),
  ],
);
