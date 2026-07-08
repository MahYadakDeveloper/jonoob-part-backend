import { Datasource } from "@infra/common-persistent";

type Stock = {
  goodId: string;
  quantity: number;
};
export interface WarehouseDatasource extends Datasource<Stock, string> {}
