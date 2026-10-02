import { integer, text, unique, uuid } from 'drizzle-orm/pg-core';
import { warehouseSchema } from './warehouse.schema';

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
    id: uuid().defaultRandom().primaryKey(),
    barcodeValue: text().notNull(),
    barcodeType: barcodeType().notNull(),
    qty: integer().default(0).notNull(),
    unitOfMeasure: unitOfMeasure().notNull(),
    storageLocation: text(),
  },
  (table) => [unique().on(table.barcodeType, table.barcodeValue)],
);
