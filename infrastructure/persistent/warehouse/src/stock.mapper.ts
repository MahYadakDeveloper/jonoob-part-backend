import { LineItems } from '@feature/common';
import { Stock } from '@feature/warehouse-api';
import { stock } from './schema';

type StockRow = typeof stock.$inferSelect;

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
