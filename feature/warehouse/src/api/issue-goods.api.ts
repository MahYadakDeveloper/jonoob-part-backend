import { IssueGoodsRequest } from "./issue-goods.request";

export interface IssueGoodsApi {
  issue(req: IssueGoodsRequest): Promise<void>;
}
