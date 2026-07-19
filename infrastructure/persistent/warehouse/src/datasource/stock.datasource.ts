import { Datasource } from "@infra/common-persistent";

type Stock = {
  goodId: string;
  quantity: number;
};
export interface StockDatasource extends Datasource<Stock, string> {}
