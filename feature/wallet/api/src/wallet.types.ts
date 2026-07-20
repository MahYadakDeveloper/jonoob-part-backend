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

export type WalletTransactionResult = {
  transactionId: string;
  walletId: string;

  amount: Money;

  balanceBefore: Money;
  balanceAfter: Money;

  occurredAt: Date;
};

export type WalletBalanceView = {
  customerId: string;

  available: Money;
  reserved: Money;

  total: Money;
};
