import { Barcode, LineItems } from "@feature/common";
import { Good } from "../model/good";
import { GoodDetails } from "../model/good-details";

export const WAREHOUSE_REPOSITORY = "IWarehouseRepository";

type Stock = { goodId: string; quantity: number };
export interface WarehouseRepository {
  issueGoods(items: LineItems<Stock>): Promise<void>;
  receiptGoods(items: LineItems<Stock>): Promise<void>;
  reserveStock(items: LineItems<Stock>): Promise<void>;
  releaseStock(items: LineItems<Stock>): Promise<void>;
  findGoodByBarcode(barcode: Barcode): Promise<Good>;
  updateGoodDetails(goodId: string, details: GoodDetails): Promise<void>;
  getAvailableStocksByIds(goodIds: string[]): Promise<LineItems<Stock>>;
}
