import { Datasource } from "@infra/common-persistent";
import { StockChangePlan } from "./stock-planner";

type Stock = {
  goodId: string;
  quantity: number;
};
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StockDatasource extends Datasource<Stock, string> {
}
