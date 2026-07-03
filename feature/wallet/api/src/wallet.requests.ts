import { Money } from "@feature/common";

export interface BalanceDeductionReq {
  customerId: string;
  amount: Money;
}

export interface WalletBalanceReq {
  customerId: string
}