import { Barcode } from "@feature/common";
import { Good } from "../model/good";
import { GoodDetails } from "../model/good-detials";

export const WAREHOUSE_REPOSITORY = "IWarehouseRepository";

type Item = { goodId: string; quantity: number };
export interface IWarehouseRepository {
  issueGoods(items: Item[]): Promise<void>;
  receiptGoods(items: Item[]): Promise<void>;
  reserveStock(items: Item[]): Promise<void>;
  releaseStock(items: Item[]): Promise<void>;
  findGoodByBarcode(barcode: Barcode): Promise<Good>;
  updateGoodDetails(goodId: string, details: GoodDetails): Promise<void>;
  getAvailableStocksByIds(goodIds: string[]): Promise<Record<string, number>>;
}
