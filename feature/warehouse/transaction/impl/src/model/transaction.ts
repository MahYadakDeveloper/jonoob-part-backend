import { RecordTransactionRequest } from '@feature/warehouse-transaction-api';

export type StockTransaction = {
  id: string;
  recordedAt: Date;
} & RecordTransactionRequest;
