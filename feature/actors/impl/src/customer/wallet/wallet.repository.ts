import { Money } from '@feature/common';

export interface WalletRepository {
  create(customerId: string): Promise<{ id: string }>;

  updateBalance(
    id: string,
    balance: { total: Money; frozen: Money },
  ): Promise<void>;

  getBalance(id: string): Promise<{ total: Money; frozen: Money }>;
}
