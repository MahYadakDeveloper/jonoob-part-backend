import { Stock } from '@feature/warehouse-api';
import { stocks } from '../schema/stocks.schema';
import { StockDefinitionData } from '../stock.repository';

export const toStock = (row: typeof stocks.$inferSelect): Stock => ({
  id: row.id,
  quantity: row.qty,
  unitOfMeasure: row.unitOfMeasure,
  barcode: {
    type: row.barcodeType,
    value: row.barcodeValue,
  },
  storageLocation: row.storageLocation ?? undefined,
});

export const toStockRow = ({
  barcode,
  ...rest
}: StockDefinitionData): typeof stocks.$inferInsert => ({
  ...rest,
  barcodeType: barcode.type,
  barcodeValue: barcode.value,
});
