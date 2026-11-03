import { check, index, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { catalogSchema } from './catalog.schema';
import { products } from './products.schema';
import { sql } from 'drizzle-orm';
import {
  BARCODE_PATTERNS,
  BARCODE_TYPES,
  CASE_SENSITIVE_TYPE,
} from './barcode-rules';

export const BARCODE_CONSTRAINTS = {
  barcodePk: 'barcodes_type_value_pk',
  barcodeValueFormat: 'barcodes_value_format_chk',
} as const;

// DDL constants only, never user input.
const lit = (s: string) => sql.raw(`'${s.replaceAll("'", "''")}'`);

export const barcodeType = catalogSchema.enum('barcode_type', BARCODE_TYPES);

export const barcodes = catalogSchema.table(
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
      name: BARCODE_CONSTRAINTS.barcodePk,
      columns: [t.type, t.value],
    }),
    index('barcodes_product_id_idx').on(t.productId),
    check(
      BARCODE_CONSTRAINTS.barcodeValueFormat,
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
