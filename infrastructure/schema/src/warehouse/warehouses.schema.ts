import { text, uuid } from 'drizzle-orm/pg-core';
import { warehouseSchema } from './warehouse.schema';

export const STOREROOM_CODE = 'storeroom';

// The shop's own storage is a regular row with code STOREROOM_CODE.
export const warehouses = warehouseSchema.table('warehouses', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  address: text('address'),
});
