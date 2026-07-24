import { Barcode, LineItems } from "@feature/common";
import { Good } from "@feature/warehouse-api";
import { GoodDetails } from "../model/good-details";

export const WAREHOUSE_REPOSITORY = "IWarehouseRepository";

type Stock = { goodId: string; quantity: number };
export interface WarehouseRepository {
  issue(stocks: LineItems<Stock>): Promise<void>;
  receipt(stocks: LineItems<Stock>): Promise<void>;
  quarantine(stocks: LineItems<Stock>): Promise<void>;
  reserve(stocks: LineItems<Stock>): Promise<void>;
  release(stocks: LineItems<Stock>): Promise<void>;
  findGoodByBarcode(barcode: Barcode): Promise<Good>;
  updateGoodDetails(goodId: string, details: GoodDetails): Promise<void>;
  getAvailableStocksByIds(goodIds: string[]): Promise<LineItems<Stock>>;
}
