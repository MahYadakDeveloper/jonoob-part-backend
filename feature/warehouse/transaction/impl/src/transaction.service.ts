import { OffsetPagination, PageCriteria, PageResult } from '@feature/common';
import {
  RecordTransactionRequest,
  type TransactionRecorderApi,
} from '@feature/warehouse-transaction-api';
import { Inject, Injectable } from '@nestjs/common';
import type {
  TransactionRepository,
  WarehouseTransaction,
} from './transaction.repository';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TransactionService implements TransactionRecorderApi {
  constructor(
    @Inject('TransactionRepository')
    private readonly repository: TransactionRepository,
  ) {}

  async record(req: RecordTransactionRequest): Promise<void> {
    await this.repository.create(req);
  }

  list(
    req: PageCriteria<OffsetPagination>,
  ): Promise<PageResult<WarehouseTransaction, OffsetPagination>> {
    return this.repository.list(req);
  }

  @Cron('0 0 4 * * 5', { timeZone: 'Asia/Tehran' })
  purgeOldTransactions() {
    await this.repository.deleteOlderThan();
  }
}
