import { StockMovementRepository } from '@/repositories/stock-movement.repository';
import {
    IssueMovementSource,
    ReceiptMovementSource,
    ReturnMovementSource,
    StockMovementApi,
    StockMovementItem,
} from '@feature/warehouse-api';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';
import { AdjustMovementSource } from './stock-movement.types';
import { StockService } from './stock.service';

@Injectable()
export class StockMovementService implements StockMovementApi {
  constructor(
    private readonly stock: StockService,
    private readonly tx: DrizzleTransactionContext,
    private readonly repository: StockMovementRepository,
  ) {}

  issue(
    stocks: StockMovementItem[],
    source: IssueMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }> {
    return this.tx.run(async () => {
      await this.stock.decrease(stocks)

      await this.repository.
    });
  }

  receipt(
    stocks: StockMovementItem[],
    source: ReceiptMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }> {
    throw new Error('Method not implemented.');
  }
  return(
    stocks: StockMovementItem[],
    source: ReturnMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }> {
    throw new Error('Method not implemented.');
  }

  adjust(
    stock: StockMovementItem,
    direction: 'inbound' | 'outbound',
    source: AdjustMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }> {
    throw new Error('');
  }

  reverse(movementId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
