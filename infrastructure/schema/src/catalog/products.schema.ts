import { primaryKey, uuid } from 'drizzle-orm/pg-core';
import { createImageTable } from '../media/helpers/media-tables';
import { brands } from './brands.schema';
import { catalogSchema } from './catalog.schema';
import { vehicles } from './vehicles.schema';

export const unitOfMeasure = catalogSchema.enum('unit_of_measure', [
  'piece',
  'pair',
  'set',
  'pack',
]);

export const products = catalogSchema.table('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  unitOfMeasure: unitOfMeasure('unit_of_measure').notNull(),

  brandId: uuid('brand_id').references(() => brands.id, {
    onDelete: 'restrict',
  }),
});

export const productCategories = catalogSchema.table('product_categories', {
  productId: uuid('product_id').references(() => products.id, {
    onDelete: 'cascade',
  }),
});

export const productFitments = catalogSchema.table(
  'product_fitments',
  {
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'cascade',
    }),

    vehicleId: uuid('fitment_id').references(() => vehicles.id, {
      onDelete: 'restrict',
    }),
  },
  (t) => [
    primaryKey({
      name: 'product_vehicle_pk',
      columns: [t.productId, t.vehicleId],
    }),
  ],
);

export const productsImages = createImageTable(catalogSchema, products, {
  name: 'product_logos',
  onOwnerDelete: 'cascade',
  relation: 'toMany',
});
