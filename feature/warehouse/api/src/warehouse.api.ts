import {
  IssueGoodsReq,
  UnitOfMeasuresOfProductsReq,
} from "./warehouse.requests";
import { UnitOfMeasuresOfProductsRes } from "./warehouse.responses";

export interface WarehouseService {
  issueGoods(req: IssueGoodsReq): Promise<void>;

  getUnitOfMeasuresOfProducts(
    req: UnitOfMeasuresOfProductsReq,
  ): Promise<UnitOfMeasuresOfProductsRes>;
}
