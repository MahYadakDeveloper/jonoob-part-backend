import { RecordTransactionRequest } from './transaction.req';

export interface TransactionRecorderApi {
  record(req: RecordTransactionRequest): Promise<void>;
}
