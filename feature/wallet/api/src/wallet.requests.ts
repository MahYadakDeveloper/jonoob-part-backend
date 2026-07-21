import { Money } from "@feature/common";

export type WalletOperationRequest = {
  customerId: string;

  /** Business reference (saleId, returnId, campaignId, etc.) */
  referenceId: string;

  /** Prevent duplicate processing */
  idempotencyKey: string;

  /** Optional audit note */
  description?: string;
};

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

export type WalletDepositRequest = WalletOperationRequest & {
  amount: Money;

  reason: "cashback" | "refund" | "manual_adjustment";
};

export type WalletWithdrawRequest = WalletOperationRequest & {
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

export interface FreezeWalletAmountRequest {
  customerId: string;
  amount: Money;

  referenceId: string;
  reason: "withdrawal-request" | "manual";
}

export interface CommitFrozenAmountRequest {
  freezeId: string;
  referenceId: string;
}

export interface ReleaseFrozenAmountRequest {
  freezeId: string;
  reason: "withdrawal-request" | "manual";
}
