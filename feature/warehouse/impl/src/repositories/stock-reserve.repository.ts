import { LineItems } from '@feature/common';
import {
  DrizzleBaseRepository,
  DrizzleDbProvider,
} from '@infra/db-drizzle';
import { AsyncLocalStorage } from 'async_hooks';
import { and, eq, or, sql } from 'drizzle-orm';
import { reserves } from './database/schema/reserves.schema';

type NewReservation = typeof reserves.$inferInsert

export class DrizzleStockReservationRepository
  extends DrizzleBaseRepository
{
  constructor(
    dbProvider: DrizzleDbProvider,
    lockContext: AsyncLocalStorage<'for_update'>,
    // private readonly cache: StockCache,
  ) {
    super(dbProvider, lockContext);
  }

  async findByReferenceId(
    referenceId: string,
  ): Promise<> {
    const query = this.db
      .select({
        referenceId: reserves.referenceId,
        stockId: reserves.stockId,
        qty: reserves.qty,
      })
      .from(reserves)
      .where(eq(reserves.referenceId, referenceId));

    const rows =
      this.lockMode === 'for_update' ? await query.for('update') : await query;

    return rows.toLineItems((row) => row.stockId);
  }

  async upsertMany(reservation: LineItems<ReserveData>): Promise<void> {
    await this.db
      .insert(reserves)
      .values([...reservation])
      .onConflictDoUpdate({
        target: [reserves.referenceId, reserves.stockId],
        set: {
          qty: sql`${reserves.qty}`,
        },
      });
  }

  async delete(referenceId: string, stockId: string): Promise<void> {
    await this.db
      .delete(reserves)
      .where(
        and(
          eq(reserves.referenceId, referenceId),
          eq(reserves.stockId, stockId),
        ),
      );
  }

  async deleteMany(
    items: LineItems<{ referenceId: string; stockId: string }>,
  ): Promise<void> {
    const conditions = [...items].map((item) =>
      and(
        eq(reserves.referenceId, item.referenceId),
        eq(reserves.stockId, item.stockId),
      ),
    );

    if (conditions.length === 0) {
      return;
    }

    await this.db.delete(reserves).where(or(...conditions));
  }
}
