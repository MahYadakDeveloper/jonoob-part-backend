import { barcodeType } from '@infra/db-drizzle/schema';

export type Barcode = {
  type: (typeof barcodeType.enumValues)[number];
  value: string;
};
