import { Barcode, LineItems, LockableRepository } from '@feature/common';
import { Stock } from '@feature/warehouse-api';

export type StockDefinitionData = Omit<Stock, 'id' | 'qty'>;

export interface StockRepository extends LockableRepository {
  findById(id: string): Promise<Stock | null>;
  findManyById(ids: string[]): Promise<LineItems<Stock>>;
  findByBarcode(barcode: Barcode): Promise<Stock | null>;
  available(id: string[]): Promise<LineItems<{ id: string; qty: number }>>;

  increase(stocks: LineItems<{ id: string; qty: number }>): Promise<void>;
  decrease(stocks: LineItems<{ id: string; qty: number }>): Promise<void>;
  adjust(stocks: LineItems<{ id: string; qty: number }>): Promise<void>;

  define(stock: StockDefinitionData): Promise<{ id: string }>;
  redefine(id: string, stock: StockDefinitionData): Promise<void>;
}
