import { sql } from 'drizzle-orm';
import { check, smallint, text, unique, uuid } from 'drizzle-orm/pg-core';

import { warehouseSchema } from './warehouse.schema';
import { warehouses } from './warehouses.schema';

/**
 * [NOTE] Pre-numbered physical shelves
 *
 * When shelves are already numbered in the physical warehouse, the system
 * should adopt the existing labels instead of generating its own. Store the
 * printed label as-is in a `code` field, unique per warehouse, and give each
 * shelf a separate internal ID that stock records reference. This way,
 * relabeling a shelf never breaks stock data. Don't parse meaning out of the
 * code string; if aisle or level is needed, keep it as explicit attributes
 * filled in at import.
 */
export const shelves = warehouseSchema.table(
  'shelves',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // NULL = storeroom shelf.
    warehouseId: uuid('warehouse_id').references(() => warehouses.id, {
      onDelete: 'restrict',
    }),

    aisle: smallint('aisle').notNull(),
    bay: smallint('bay').notNull(),
    // 0 = ground floor, counted upwards
    level: smallint('level').notNull(),

    // Derived from the coordinates, so it can never drift from them.
    // Fixed width keeps text ordering equal to physical ordering: 02-14-3
    code: text('code').notNull().generatedAlwaysAs(sql`
        lpad(aisle::text, 2, '0') || '-' || lpad(bay::text, 2, '0') || '-' || level::text
      `),
  },
  (t) => [
    // NULLS NOT DISTINCT: warehouse_id is NULL for storeroom shelves, and
    // without it the same position could exist twice there.
    // Requires PostgreSQL 15+.
    unique('shelves_position_uq')
      .on(t.warehouseId, t.aisle, t.bay, t.level)
      .nullsNotDistinct(),
    // Lookup by scanned code (same NULL reasoning as above).
    unique('shelves_warehouse_code_uq')
      .on(t.warehouseId, t.code)
      .nullsNotDistinct(),
    check('shelves_aisle_chk', sql`${t.aisle} BETWEEN 1 AND 99`),
    check('shelves_bay_chk', sql`${t.bay} BETWEEN 1 AND 99`),
    check('shelves_level_chk', sql`${t.level} BETWEEN 0 AND 9`),
  ],
);
