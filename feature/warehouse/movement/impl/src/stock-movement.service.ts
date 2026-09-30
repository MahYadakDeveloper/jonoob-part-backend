import { StockMovement, StockMovementApi } from '@feature/warehouse-api';
import {
  STOCK_MUTATION_API,
  type StockMutationApi,
} from '@feature/warehouse-stock-api';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class StockMovementService implements StockMovementApi {
  constructor(
    @Inject(STOCK_MUTATION_API)
    private readonly stockMutation: StockMutationApi,
    private readonly tx: DrizzleTransactionContext,
  ) {}

  async issue(
    stocks: { id: string; quantity: number }[],
  ): Promise<StockMovement> {
    await this.tx.run(async () => {
      this.stockMutation.decrease(stocks);
    });
    throw new Error('Method not implemented.');
  }
  receipt(stocks: { id: string; quantity: number }[]): Promise<StockMovement> {
    throw new Error('Method not implemented.');
  }
  return(stocks: { id: string; quantity: number }[]): Promise<StockMovement> {
    throw new Error('Method not implemented.');
  }
  reverse(movementId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
