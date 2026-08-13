import { Barcode, LineItems } from '@feature/common';
import { Stock } from '../model/stock';

type StockItem = { goodId: string; quantity: number };
export interface StockRepository {
  issue(stocks: LineItems<StockItem>): Promise<void>;
  receipt(stocks: LineItems<StockItem>): Promise<void>;
  reserve(stocks: LineItems<StockItem>): Promise<void>;
  release(stocks: LineItems<StockItem>): Promise<void>;
  adjustMany(stocks: LineItems<StockItem>): Promise<void>;
  findStockByBarcode(barcode: Barcode): Promise<Stock | null>;
  getAvailableStocks(goodIds: string[]): Promise<LineItems<Stock>>;
}
