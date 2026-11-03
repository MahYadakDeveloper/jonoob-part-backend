import { sql } from 'drizzle-orm';
import { check, text, uuid } from 'drizzle-orm/pg-core';
import { createImageTable } from '../media/helpers/media-tables';
import { catalogSchema, slugChecks } from './catalog.schema';

export const brands = catalogSchema.table(
  'brands',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: text('name').unique().notNull(),
    slug: text('slug').unique().notNull(),
  },
  (t) => [
    check(
      'brands_name_length_chk',
      sql`char_length(${t.name}) between 1 and 100`,
    ),
    ...slugChecks('brands', t.slug),
  ],
);

export const brandLogos = createImageTable(catalogSchema, brands, {
  name: 'brand_logos',
  onOwnerDelete: 'cascade',
  relation: 'toOne',
  mimes: ['image/png', 'image/svg+xml', 'image/webp'],
});
