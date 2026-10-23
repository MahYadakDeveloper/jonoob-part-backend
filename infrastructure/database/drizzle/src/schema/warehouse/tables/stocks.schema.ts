import { integer, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { warehouseSchema } from '../warehouse.schema';

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
    unique('uq_barcode_type_barcode_value').on(t.barcodeType, t.barcodeValue),
  ],
);
