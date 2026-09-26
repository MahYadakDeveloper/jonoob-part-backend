import { PageCriteria, PageResult } from '@feature/common';
import {
  RecordTransactionRequest,
  type TransactionRecorderApi,
} from '@feature/warehouse-transaction-api';
import { Inject, Injectable } from '@nestjs/common';
import {
  WarehouseTransaction,
  type StockTransactionRepository,
} from './transaction.repository';

@Injectable()
export class TransactionService implements TransactionRecorderApi {
  constructor(
    @Inject('StockTransactionRepository')
    private readonly repository: StockTransactionRepository,
  ) {}

  async record(req: RecordTransactionRequest): Promise<void> {
    await this.repository.create({ ...req, recordedAt: new Date() });
  }

  list(req: PageCriteria): Promise<PageResult<WarehouseTransaction>> {
    return this.repository.list(req);
  }
}
