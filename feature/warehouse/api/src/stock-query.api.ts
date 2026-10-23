import { Barcode } from '@feature/shared/types/barcode';
import { UnitOfMeasure } from '@feature/shared/types/unit-of-measure';

export type Stock = {
  id: string;
  quantity: number;
  barcode: Barcode;
  unitOfMeasure: UnitOfMeasure;
  storageLocation: string | null;
  reservedQty: number;
};

export const STOCK_QUERY_API = Symbol('StockQueryApi');

export interface StockQueryApi {
  /**
   *
   */
  findById(input: { stockId: string }): Promise<Stock>;
  findManyById(input: { stockIds: string[] }): Promise<Stock[]>;
  findByBarcode(input: { barcode: Barcode }): Promise<Stock>;

  /**
   *
   */
  available(input: {
    stockIds: string[];
  }): Promise<{ stockId: string; available: boolean }[]>;
}
