import { Money } from "@feature/common";
import { WalletOperationRequest } from "./wallet.types";

export type RefundWalletRequest = {
  customerId: string;

  amount: Money;

  /** Original payment transaction id */
  originalTransactionId: string;

  /** Return document id */
  referenceId: string;

  idempotencyKey: string;

  description?: string;
};

export type CreditWalletRequest = WalletOperationRequest & {
  amount: Money;

  reason: "cashback" | "refund" | "manual_adjustment";
};

export type DebitWalletRequest = WalletOperationRequest & {
  amount: Money;

  reason:
    | "sale_payment"
    | "withdrawal"
    | "cashback_reversal"
    | "manual_adjustment";
};

export interface GetWalletBalanceRequest {
  customerId: string;
}
