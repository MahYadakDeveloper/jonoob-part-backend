import { Cache } from "@infra/common-persistent";
import { StockChangePlan } from "../stock-planner";

type Stock = number;

export interface StockCache extends Cache<Stock> {
  synchronize(changes: StockChangePlan): Promise<void>;
}
