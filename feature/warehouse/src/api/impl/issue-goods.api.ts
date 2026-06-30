import { IssueGoodsApi } from "../issue-goods.api";
import { IssueGoodsRequest } from "../issue-goods.request";

export class IssueGoodsApiImpl implements IssueGoodsApi {
  issue(req: IssueGoodsRequest): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
