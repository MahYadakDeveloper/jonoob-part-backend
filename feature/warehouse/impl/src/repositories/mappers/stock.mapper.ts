import { Stock } from '@feature/warehouse-api';
import { stocks } from '@infra/db-drizzle';
import { StockDefinitionData } from './stock.repository';

type StockRow = typeof stocks.$inferSelect;

const toStockItem = (row: StockRow): Stock => ({
  id: row.id,
  quantity: row.qty,
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

export const toStockInsert = ({
  barcode,
  ...rest
}: StockDefinitionData): typeof stocks.$inferInsert => ({
  ...rest,
  barcodeType: barcode.type,
  barcodeValue: barcode.value,
});
