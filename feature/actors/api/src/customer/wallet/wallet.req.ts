export type WalletOperationRequest = {
  customerId: string;

  /** Prevent duplicate processing */
  idempotencyKey: string;

  /** Optional audit note */
  description?: string;
};

export type RefundWalletRequest = {
  customerId: string;

  amount: number;

  /** Original payment transaction id */
  originalTransactionId: string;

  idempotencyKey: string;

  description?: string;
};

export type WalletDepositRequest = WalletOperationRequest & {
  amount: number;

  reason: 'cashback' | 'refund' | 'manual_adjustment';
};

export type WalletWithdrawRequest = WalletOperationRequest & {
  amount: number;

  reason: 'payment' | 'withdrawal' | 'cashback_reversal' | 'manual_adjustment';
};

export interface GetWalletBalanceRequest {
  customerId: string;
}

export interface FreezeWalletAmountRequest {
  customerId: string;
  amount: number;

  reason: 'withdrawal-request' | 'manual';
}

export interface CommitFrozenAmountRequest {
  freezeId: string;
}

export interface ReleaseFrozenAmountRequest {
  freezeId: string;
  reason: 'withdrawal-request' | 'manual';
}
