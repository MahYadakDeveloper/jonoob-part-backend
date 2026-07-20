import { GrantedCashback, Money } from "@feature/common";
import { CashbackReversalPolicy } from "./cashback.enums";

export interface ReversalCashbackRequest {
  customerId: string;
  refundAmount: Money;
  referenceId: string;
  granted: GrantedCashback;
  policy: CashbackReversalPolicy;
}

export interface GrantingCashbackRequest {
  customerId: string;
  referenceId: string;
  purchaseAmount: Money;
}
