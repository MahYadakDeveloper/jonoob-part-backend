import { ReversalCashbackRequest } from "./cashback.requests";

export interface ICashbackService {
  reverseCashback(request: ReversalCashbackRequest): Promise<void>
}