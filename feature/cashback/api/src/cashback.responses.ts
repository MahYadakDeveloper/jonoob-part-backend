import { Money } from "@feature/common";

export interface ReversalCashbackResponse {
  payableRefund: Money;
}

export interface GrantingCashbackResponse {
  grantedCashback: Money
}
