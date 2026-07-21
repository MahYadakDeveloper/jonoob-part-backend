import { RefundRequest } from "./settlement.requests";

export interface SettlementApi {
  refund(request: RefundRequest): Promise<void>;
}
