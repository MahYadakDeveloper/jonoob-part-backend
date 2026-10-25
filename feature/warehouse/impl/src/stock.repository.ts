import { sqlCase } from '@feature/shared/utils/common';
import { stocks } from '@feature/warehouse-schema';
import { DrizzleBaseRepository } from '@infra/db-drizzle';
import { eq, inArray, sql } from 'drizzle-orm';

interface IncreaseItem {
  stockId: string;
  quantity: number;
}

interface DecreaseItem {
  stockId: string;
  quantity: number;
}

export class StockRepository extends DrizzleBaseRepository {
  findManyStockById(stockIds: string[]) {
    return this.applyForUpdateConditionally(
      this.db
        .select({
          id: stocks.id,
          quantity: stocks.quantity,
        })
        .from(stocks)
        .where(inArray(stocks.id, stockIds)),
    );
  }
  async increase(items: IncreaseItem[]): Promise<void> {
    await this.db
      .update(stocks)
      .set({
        quantity: sql`${stocks.quantity} + ${sqlCase<number>(
          items.map((i) => ({
            when: eq(stocks.id, i.stockId),
            then: sql`${i.quantity}`,
          })),
          sql`0`,
        )}`,
      })
      .where(
        inArray(
          stocks.id,
          items.map(({ stockId }) => stockId),
        ),
      );
  }

  async decrease(items: DecreaseItem[]): Promise<void> {
    await this.db
      .update(stocks)
      .set({
        quantity: sql`${stocks.quantity} - ${sqlCase<number>(
          items.map((i) => ({
            when: eq(stocks.id, i.stockId),
            then: sql`${i.quantity}`,
          })),
          sql`0`,
        )}`,
      })
      .where(
        inArray(
          stocks.id,
          items.map(({ stockId }) => stockId),
        ),
      );
  }
}
