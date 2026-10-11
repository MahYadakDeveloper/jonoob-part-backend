export interface GetWalletBalanceResponse {
  total: number;
  frozen: number;
  available: number;
}

export type WalletTransactionResponse = {
  transactionId: string;
};

export interface FrozenBalanceResponse {
  freezeId: string;
  amount: number;
  expiresAt?: Date;
}
