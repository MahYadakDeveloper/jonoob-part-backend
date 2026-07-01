import { IssueGoodsRequest } from "../issue-goods.request";
import { WarehouseApi } from "../warehouse.api";

export class WarehouseApiImpl implements WarehouseApi {
  issueGoods(req: IssueGoodsRequest): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
