import { ReversalCashbackRequest } from "./cashback.requests";
import { ReversalCashbackResponse } from "./cashback.responses";

export interface ICashbackService {
  processCashbackReversal(
    request: ReversalCashbackRequest,
  ): Promise<ReversalCashbackResponse>;
}
