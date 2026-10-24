import { Barcode } from '@feature/shared/types/barcode';
import { UnitOfMeasure } from '@feature/shared/types/unit-of-measure';

export type Stock = {
  id: string;
  quantity: number;
  barcode: Barcode;
  unitOfMeasure: UnitOfMeasure;
  storageLocation: string | null;
  reservedQuantity: number | null;
};

export const STOCK_QUERY_API = Symbol('StockQueryApi');

export interface StockQueryApi {
  /**
   *
   */
  getById(input: { stockId: string }): Promise<Stock>;
  getManyById(input: { stockIds: string[] }): Promise<Stock[]>;
  getByBarcode(input: { barcode: Barcode }): Promise<Stock>;

  /**
   *
   */
  available(input: {
    stockIds: string[];
  }): Promise<{ stockId: string; available: boolean }[]>;
}
