import { Cache } from "@infra/common-persistent";
import { StockChangePlan } from "./stock-planner";

export type Stock = number;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WarehouseCache extends Cache<Stock> {
  applyChanges(changes: StockChangePlan): Promise<void>;
  getReservedMany(keys: string[]): Promise<Map<string, Stock>>;
  reserveMany(entries: ReadonlyMap<string, Stock>): Promise<void>;
}
