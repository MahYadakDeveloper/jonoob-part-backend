import { LineItems } from '@feature/common';

export type QuarantinedStock = {
  stockId: string;
  referenceId: string;
  reason: string;
  qty: number;
};
export interface StockQuarantineRepository {
  findAll(): LineItems<QuarantinedStock>;
  quarantine(stock: LineItems<QuarantinedStock>): Promise<void>;
  release(stocks: LineItems<{ stockId: string; qty: number }>): Promise<void>;
}
