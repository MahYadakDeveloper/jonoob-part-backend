import { CalculationCashbackRequest, ReversalCashbackRequest } from "./cashback.requests";
import { CalculationCashbackResponse, ReversalCashbackResponse } from "./cashback.responses";

export interface ICashbackService {
  reverseCashback(request: ReversalCashbackRequest): Promise<ReversalCashbackResponse>
  calculateCashback(request: CalculationCashbackRequest): Promise<CalculationCashbackResponse>
}