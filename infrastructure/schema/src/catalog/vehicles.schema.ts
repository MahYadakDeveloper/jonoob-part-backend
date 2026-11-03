import {
  foreignKey,
  index,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createImageTable } from '../media/helpers/media-tables';
import { catalogSchema } from './catalog.schema';
import { slugChecks } from './helpers/slug-checks';

export const makes = catalogSchema.table(
  'makes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
  },
  (t) => [...slugChecks('makes', t.slug)],
);

export const models = catalogSchema.table(
  'models',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    makeId: uuid('make_id')
      .notNull()
      .references(() => makes.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
  },
  (t) => [
    unique('models_make_name_unique').on(t.makeId, t.name),
    unique('models_make_slug_unique').on(t.makeId, t.slug),
    unique('models_id_make_unique').on(t.id, t.makeId),
    ...slugChecks('models', t.slug),
  ],
);

export const series = catalogSchema.table(
  'series',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => models.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
  },
  (t) => [
    unique('series_model_name_unique').on(t.modelId, t.name),
    unique('series_model_slug_unique').on(t.modelId, t.slug),
    unique('series_id_model_unique').on(t.id, t.modelId),
    ...slugChecks('series', t.slug),
  ],
);

export const transmissions = catalogSchema.table(
  'transmissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
  },
  (t) => [...slugChecks('transmissions', t.slug)],
);

export const fuels = catalogSchema.table(
  'fuels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
  },
  (t) => [...slugChecks('fuels', t.slug)],
);

export const vehicles = catalogSchema.table(
  'vehicles',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    makeId: uuid('make_id').notNull(),
    modelId: uuid('model_id').notNull(),

    seriesId: uuid('series_id'),
    transmissionId: uuid('transmission_id').references(() => transmissions.id, {
      onDelete: 'restrict',
    }),
    fuelId: uuid('fuel_id').references(() => fuels.id, {
      onDelete: 'restrict',
    }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: 'vehicles_model_make_fk',
      columns: [t.modelId, t.makeId],
      foreignColumns: [models.id, models.makeId],
    }).onDelete('restrict'),

    foreignKey({
      name: 'vehicles_series_model_fk',
      columns: [t.seriesId, t.modelId],
      foreignColumns: [series.id, series.modelId],
    }).onDelete('restrict'),

    unique('vehicles_identity_unique')
      .on(t.makeId, t.modelId, t.seriesId, t.transmissionId, t.fuelId)
      .nullsNotDistinct(),

    index('vehicles_make_model_idx').on(t.makeId, t.modelId),
  ],
);

export const makeLogos = createImageTable(catalogSchema, makes, {
  name: 'make_logos',
  onOwnerDelete: 'cascade',
  relation: 'toOne',
  mimes: ['image/png', 'image/svg+xml', 'image/webp'],
});

export const vehicleImages = createImageTable(catalogSchema, vehicles, {
  name: 'vehicle_images',
  onOwnerDelete: 'cascade',
  relation: 'toOne',
});
