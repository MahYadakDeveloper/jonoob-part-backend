export type QuarantinedStock = {
  id: string;
  stockId: string;
  referenceId: string;
  reason: string;
  qty: number;
};

export interface StockQuarantineRepository {
  findAll(): Promise<QuarantinedStock[]>;
  quarantine(stock: Omit<QuarantinedStock, 'id'>[]): Promise<void>;
  release(
    quarantines: {
      id: string;
      qty: number;
    }[],
  ): Promise<void>;
}
