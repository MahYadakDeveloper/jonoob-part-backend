import { Money } from '@feature/common';

export type Wallet = {
  id: string;
  total: Money;
  frozen: Money;
};

export interface WalletRepository {
  create(customerId: string): Promise<{ id: string }>;

  updateBalance(
    id: string,
    balance: { total: Money; frozen: Money },
  ): Promise<void>;
}
