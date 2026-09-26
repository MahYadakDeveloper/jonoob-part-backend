import * as p from 'drizzle-orm/pg-core';
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
    id: p.uuid().defaultRandom().primaryKey(),
    barcodeValue: p.text().notNull(),
    barcodeType: barcodeType().notNull(),
    qty: p.integer().default(0).notNull(),
    unitOfMeasure: unitOfMeasure().notNull(),
    storageLocation: p.text(),
  },
  (table) => [p.unique().on(table.barcodeType, table.barcodeValue)],
);
