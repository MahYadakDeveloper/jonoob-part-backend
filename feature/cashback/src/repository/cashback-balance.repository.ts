import { Money } from "@feature/common";

export interface ICashbackBalanceRepository {
  getBalance(customerId: string): Promise<Money>;
  increaseBalance(customerId: string, amount: Money): Promise<void>;
  decreaseBalance(customerId: string, amount: Money): Promise<void>;
}
