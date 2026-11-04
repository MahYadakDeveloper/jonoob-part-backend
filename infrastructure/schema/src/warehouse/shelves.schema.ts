import { sql } from 'drizzle-orm';
import { check, smallint, text, unique, uuid } from 'drizzle-orm/pg-core';
import { warehouseSchema } from './warehouse.schema';
import { warehouses } from './warehouses.schema';

export const shelves = warehouseSchema.table(
  'shelves',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'restrict' }),

    aisle: smallint('aisle').notNull(),
    bay: smallint('bay').notNull(),
    // 0 = ground floor, counted upwards
    level: smallint('level').notNull(),

    // Derived from the coordinates, so it can never drift from them.
    // Fixed width keeps text ordering equal to physical ordering: 02-014-3
    code: text('code')
      .notNull()
      .generatedAlwaysAs(
        sql`lpad(aisle::text, 2, '0') || '-' || lpad(bay::text, 3, '0') || '-' || level::text`,
      ),
  },
  (t) => [
    unique('shelves_position_uq').on(t.warehouseId, t.aisle, t.bay, t.level),
    // Lookup by scanned code.
    unique('shelves_warehouse_code_uq').on(t.warehouseId, t.code),
    // Target of the composite FK from stocks.
    unique('shelves_id_warehouse_uq').on(t.id, t.warehouseId),
    check('shelves_aisle_chk', sql`${t.aisle} BETWEEN 1 AND 99`),
    check('shelves_bay_chk', sql`${t.bay} BETWEEN 1 AND 999`),
    check('shelves_level_chk', sql`${t.level} BETWEEN 0 AND 9`),
  ],
);
