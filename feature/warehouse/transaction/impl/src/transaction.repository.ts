import { StockTransaction } from './model/transaction';

export interface StockTransactionRepository {
  create(transaction: Omit<StockTransaction, 'id'>): Promise<void>;
}
