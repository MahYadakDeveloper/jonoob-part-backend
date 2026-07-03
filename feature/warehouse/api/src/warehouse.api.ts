import {
  IssueGoodsRequest,
  UnitOfMeasuresOfProductsRequest,
} from "./warehouse.requests";
import { UnitOfMeasuresOfProductsResponse } from "./warehouse.responses";

export interface IWarehouseService {
  recordGoodsIssue(req: IssueGoodsRequest): Promise<void>;

  getUnitOfMeasuresOfProducts(
    req: UnitOfMeasuresOfProductsRequest,
  ): Promise<UnitOfMeasuresOfProductsResponse>;
}
