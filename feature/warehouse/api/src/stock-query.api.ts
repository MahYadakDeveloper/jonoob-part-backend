import { barcodeType, stocks } from '@feature/warehouse-schema';

export type Stock = typeof stocks.$inferSelect;

export interface GetByIdInput {
  stockId: string;
}

export interface GetManyByIdInput {
  stockIds: string[];
}

export interface GetByBarcodeInput {
  barcodeType: (typeof barcodeType.enumValues)[number];
  barcodeValue: string;
}

export interface AvailableInput {
  stockIds: string[];
}

export interface AvailableResult {
  available: { stockId: string; available: boolean }[];
}

export const STOCK_QUERY_API = Symbol('WAREHOUSE_STOCK_QUERY_API');

export interface StockQueryApi {
  getById(input: GetByIdInput): Promise<Stock>;
  getManyById(input: GetManyByIdInput): Promise<Stock[]>;
  getByBarcode(input: GetByBarcodeInput): Promise<Stock>;

  available(input: AvailableInput): Promise<AvailableResult>;
}
