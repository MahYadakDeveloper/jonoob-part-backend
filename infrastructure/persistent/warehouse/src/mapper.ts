import { Barcode } from '@feature/common';
import { Stock } from '@feature/warehouse-api';
import { Prisma } from '@infra/db-prisma';

export const toStock = (data: Prisma.StockModel): Stock => ({
  ...data,
  barcode: Barcode.create(data.barcodeValue, data.barcodeType),

  storageLocation: data.storageLocation ?? undefined,
});
