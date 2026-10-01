import {
  IssueMovementSource,
  ReceiptMovementSource,
  ReturnMovementSource,
  StockMovementApi,
  StockMovementItem,
} from '@feature/warehouse-api';
import {
  STOCK_MUTATION_API,
  type StockMutationApi,
} from '@feature/warehouse-stock-api';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { Inject, Injectable } from '@nestjs/common';
import { StockMovementRepository } from './repository/stock-movement.repository';
import { AdjustMovementSource } from './stock-movement.types';

@Injectable()
export class StockMovementService implements StockMovementApi {
  constructor(
    @Inject(STOCK_MUTATION_API)
    private readonly stockMutation: StockMutationApi,
    private readonly tx: DrizzleTransactionContext,
    private readonly repository: StockMovementRepository,
  ) {}

  issue(
    stocks: StockMovementItem[],
    source: IssueMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }> {
    return this.tx.run(async () => {});
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
