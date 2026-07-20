import {
  GrantingCashbackRequest,
  ReversalCashbackRequest,
} from "./cashback.requests";
import {
  GrantingCashbackResponse,
  ReversalCashbackResponse,
} from "./cashback.responses";

export interface CashbackApi {
  grantCashback(
    request: GrantingCashbackRequest,
  ): Promise<GrantingCashbackResponse>;
  processCashbackReversal(
    request: ReversalCashbackRequest,
  ): Promise<ReversalCashbackResponse>;
}
