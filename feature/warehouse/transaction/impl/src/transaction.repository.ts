import { PageCriteria, PageResult } from '@feature/common';
import { RecordTransactionRequest } from '@feature/warehouse-transaction-api';

export type WarehouseTransaction = {
  id: string;
  recordedAt: Date;
} & RecordTransactionRequest;

export interface StockTransactionRepository {
  create(transaction: Omit<WarehouseTransaction, 'id'>): Promise<void>;
  list(criteria: PageCriteria): Promise<PageResult<WarehouseTransaction>>;
}
