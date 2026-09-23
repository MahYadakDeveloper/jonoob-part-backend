import * as p from 'drizzle-orm/pg-core';

export const barcodeType = p.pgEnum('barcode_type', [
  'UPC_A',
  'UPC_E',
  'EAN_13',
  'EAN_8',
  'Code39',
  'Code93',
  'Code128',
  'Codabar',
]);

export const unitOfMeasure = p.pgEnum('unit_of_measure', [
  'piece',
  'pair',
  'set',
]);

export const stocks = p.pgTable(
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
