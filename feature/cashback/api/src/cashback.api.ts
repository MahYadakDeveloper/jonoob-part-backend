import { GrantCashbackRequest } from "./cashback.requests";
import { GrantCashbackResponse } from "./cashback.responses";

export interface ICashbackService {
  grantCashback(req: GrantCashbackRequest): Promise<GrantCashbackResponse>
}