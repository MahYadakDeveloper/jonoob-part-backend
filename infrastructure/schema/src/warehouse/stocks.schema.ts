import {
  check,
  index,
  integer,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { warehouseSchema } from './warehouse.schema';
import { sql } from 'drizzle-orm';

export const barcodeType = warehouseSchema.enum('barcode_type', [
  'UPC_A',
  'UPC_E',
  'EAN_13',
  'EAN_8',
  'Code39',
  'Code93',
  'Code128',
  'Codabar',
]);

export const unitOfMeasure = warehouseSchema.enum('unit_of_measure', [
  'piece',
  'pair',
  'set',
]);

export const STOCK_CONSTRAINTS = {
  barcodeUnique: 'uq_barcode_type_barcode_value',
  quantityNonNegative: 'stocks_quantity_non_negative',
  barcodeValueFormat: 'stocks_barcode_value_format',
  storageLocationNotBlank: 'stocks_storage_location_not_blank',
} as const;

export const stocks = warehouseSchema.table(
  'stocks',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    barcodeType: barcodeType('barcode_type').notNull(),
    barcodeValue: text('barcode_value').notNull(),
    quantity: integer('quantity').default(0).notNull(),
    unitOfMeasure: unitOfMeasure('unit_of_measure').notNull(),
    storageLocation: text('storage_location'),
    definedAt: timestamp('defined_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique(STOCK_CONSTRAINTS.barcodeUnique).on(t.barcodeType, t.barcodeValue),

    check(STOCK_CONSTRAINTS.quantityNonNegative, sql`${t.quantity} >= 0`),

    check(
      STOCK_CONSTRAINTS.barcodeValueFormat,
      sql`
        CASE ${t.barcodeType}
          WHEN 'UPC_A'   THEN ${t.barcodeValue} ~ '^[0-9]{12}$'
          WHEN 'UPC_E'   THEN ${t.barcodeValue} ~ '^[0-9]{8}$'
          WHEN 'EAN_13'  THEN ${t.barcodeValue} ~ '^[0-9]{13}$'
          WHEN 'EAN_8'   THEN ${t.barcodeValue} ~ '^[0-9]{8}$'
          WHEN 'Code39'  THEN ${t.barcodeValue} ~ '^[0-9A-Z. $/+%-]+$'
          WHEN 'Code93'  THEN ${t.barcodeValue} ~ '^[0-9A-Z. $/+%-]+$'
          WHEN 'Code128' THEN ${t.barcodeValue} ~ '^[\x20-\x7E]+$'
          WHEN 'Codabar' THEN ${t.barcodeValue} ~ '^[A-D][0-9$:/.+-]+[A-D]$'
        END
      `,
    ),

    check(
      STOCK_CONSTRAINTS.storageLocationNotBlank,
      sql`${t.storageLocation} IS NULL OR btrim(${t.storageLocation}) <> ''`,
    ),

    index('stocks_storage_location_idx').on(t.storageLocation),
  ],
);
