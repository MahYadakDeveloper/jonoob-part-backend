import { Money } from "@feature/common";

export interface GetWalletBalanceResponse {
  total: Money;
  frozen: Money;
  available: Money;
}

export type WalletTransactionResponse = {
  transactionId: string;
  walletId: string;

  amount: Money;

  balanceBefore: Money;
  balanceAfter: Money;

  occurredAt: Date;
};

export interface FrozenBalanceResponse {
  freezeId: string;
  customerId: string;
  amount: Money;
  expiresAt?: Date;
}
