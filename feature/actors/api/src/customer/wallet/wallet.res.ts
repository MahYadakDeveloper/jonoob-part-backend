export interface GetWalletBalanceResponse {
  total: number;
  frozen: number;
  available: number;
}

export type WalletTransactionResponse = {
  transactionId: string;

  amount: number;

  balanceBefore: number;
  balanceAfter: number;

  occurredAt: Date;
};

export interface FrozenBalanceResponse {
  freezeId: string;
  amount: number;
  expiresAt?: Date;
}
