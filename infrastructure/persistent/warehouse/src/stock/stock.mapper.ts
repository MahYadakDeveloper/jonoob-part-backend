import { LineItems } from '@feature/common';
import { StockDefinitionData } from '@feature/warehouse';
import { Stock } from '@feature/warehouse-api';
import { stocks } from './drizzle-stocks.schema';

type StockRow = typeof stocks.$inferSelect;

const toStockItem = (row: StockRow): Stock => ({
  id: row.id,
  qty: row.qty,
  unitOfMeasure: row.unitOfMeasure,
  barcode: {
    type: row.barcodeType,
    value: row.barcodeValue,
  },
  storageLocation: row.storageLocation ?? undefined,
});

export const toStock = (rows: StockRow[]): Stock | null => {
  const row = rows[0];

  return row ? toStockItem(row) : null;
};

export const toStocks = (rows: StockRow[]): LineItems<Stock> =>
  rows.map(toStockItem).toLineItems((s) => s.id);

export const toStockInsert = ({
  barcode,
  ...rest
}: StockDefinitionData): typeof stocks.$inferInsert => ({
  ...rest,
  barcodeType: barcode.type,
  barcodeValue: barcode.value,
});
