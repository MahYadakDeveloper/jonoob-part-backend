export const WAREHOUSE_REPOSITORY = "IWarehouseRepository";

type Item = { goodId: string; quantity: number };
export interface IWarehouseRepository {
  issueGoods(items: Item[]): Promise<void>;
  receiptGoods(items: Item[]): Promise<void>;
  reserveStock(items: Item[]): Promise<void>;
  releaseStock(items: Item[]): Promise<void>;
  getAvailableStocksByIds(goodIds: string[]): Promise<Record<string, number>>;
}
