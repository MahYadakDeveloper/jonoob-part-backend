import { CustomerType, Money } from "@feature/common";
import { CashbackReversalPolicy } from "./cashback.enums";

export interface ReversalCashbackRequest {
  customerId: string;
  refundAmount: Money;
  policy: CashbackReversalPolicy;
}

export interface GrantingCashbackRequest {
  customerId: string;
  purchaseAmount: Money;
}
