import { CustomerType, Money } from "@feature/common";
import { CashbackReversalPolicy } from "./cashback.enums";

export interface ReversalCashbackRequest {
  customerId: string;
  refund: Money;
  policy: CashbackReversalPolicy;
}
