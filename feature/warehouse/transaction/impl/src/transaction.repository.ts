import {
  OffsetPagination,
  PageCriteria,
  PageResult,
  PartialBy,
} from '@feature/common';
import { RecordTransactionRequest } from '@feature/warehouse-transaction-api';

export type WarehouseTransaction = {
  id: string;
  recordedAt: Date;
} & RecordTransactionRequest;

export interface TransactionRepository {
  create(data: Omit<WarehouseTransaction, 'id' | 'recordedAt'>): Promise<void>;
  list(
    criteria: PageCriteria<OffsetPagination>,
  ): Promise<PageResult<WarehouseTransaction, OffsetPagination>>;
}
