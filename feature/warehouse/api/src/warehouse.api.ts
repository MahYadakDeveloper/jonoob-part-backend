import { IssueGoodsRequest } from "./issue-goods.request";

export interface WarehouseService {
  issueGoods(req: IssueGoodsRequest): Promise<void>;
}
