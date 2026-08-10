import { LineItems } from '@feature/common';

export type QuarantinedStock = {
  goodId: string;
  referenceId?: string;
  reason: string;
  quantity: number;
};
export interface StockQuarantineRepository {
  quarantineMany(stock: LineItems<QuarantinedStock>): Promise<void>;
  releaseMany(stocks: LineItems<{ goodId: string; quantity: number }>): Promise<void>;
  quarantined(goodId?: string): Promise<void>;
}
