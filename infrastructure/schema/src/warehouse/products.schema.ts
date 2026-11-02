import { sql } from 'drizzle-orm';
import { warehouseSchema } from './warehouse.schema';
import {
  BARCODE_PATTERNS,
  BARCODE_TYPES,
  CASE_SENSITIVE_TYPE,
} from './barcode-rules';
import { check, index, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

export const PRODUCTS_CONSTRAINTS = {
  barcodePk: 'value_type_pk',
  barcodeValueFormat: 'barcode_value_format_chk',
} as const;

export const unitOfMeasure = warehouseSchema.enum('unit_of_measure', [
  'piece',
  'pair',
  'set',
]);

// DDL constants only, never user input.
const lit = (s: string) => sql.raw(`'${s.replaceAll("'", "''")}'`);

export const barcodeType = warehouseSchema.enum('barcode_type', BARCODE_TYPES);

export const barcodes = warehouseSchema.table(
  'barcodes',
  {
    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    type: barcodeType('type').notNull(),
    rawValue: text('raw_value').notNull(), // the only written column
    value: text('value') // canonical, derived
      .notNull()
      .generatedAlwaysAs(
        sql`CASE WHEN type = ${lit(CASE_SENSITIVE_TYPE)} THEN btrim(raw_value) ELSE upper(btrim(raw_value)) END`,
      ),
  },
  (t) => [
    primaryKey({
      name: PRODUCTS_CONSTRAINTS.barcodePk,
      columns: [t.type, t.value],
    }),
    index('barcodes_product_id_idx').on(t.productId),
    check(
      PRODUCTS_CONSTRAINTS.barcodeValueFormat,
      sql`CASE ${t.type} ${sql.join(
        Object.entries(BARCODE_PATTERNS).map(
          ([type, pattern]) =>
            sql`WHEN ${lit(type)} THEN ${t.value} ~ ${lit(pattern)}`,
        ),
        sql` `,
      )} ELSE false END`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// What the item IS (identity). One row per kind of item.
// ---------------------------------------------------------------------------
export const products = warehouseSchema.table('products', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  unitOfMeasure: unitOfMeasure('unit_of_measure').notNull(),
});
