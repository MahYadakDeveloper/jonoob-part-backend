import { GrantedCashback, Money } from "@feature/common";
import { CashbackReversalPolicy } from "./cashback.enums";

export interface ReversalCashbackRequest {
  customerId: string;
  refundAmount: Money;
  granted: GrantedCashback;
  policy: CashbackReversalPolicy;
}

export interface GrantingCashbackRequest {
  customerId: string;
  purchaseAmount: Money;
}
