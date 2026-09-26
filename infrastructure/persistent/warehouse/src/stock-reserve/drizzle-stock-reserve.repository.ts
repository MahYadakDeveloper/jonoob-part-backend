import { type DbProvider, LineItems } from '@feature/common';
import { ReserveData, ReserveRepository } from '@feature/warehouse-reserve';
import { BaseRepository, type DbLockContext } from '@infra/persistent-common';
import { Inject } from '@nestjs/common';
import { and, EmptyRelations, eq, or, sql } from 'drizzle-orm';
import { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';
import { reserves } from './drizzle-stock-reserve.schema';

export class DrizzleStockReserveRepository
  extends BaseRepository<NodePgDatabase | NodePgTransaction<EmptyRelations>>
  implements ReserveRepository
{
  constructor(
    @Inject('DbProvider')
    dbProvider: DbProvider<NodePgDatabase>,
    @Inject('DbLockContext')
    private readonly lock: DbLockContext,
    // private readonly cache: StockCache,
  ) {
    super(dbProvider);
  }

  async findByReferenceId(
    referenceId: string,
  ): Promise<LineItems<ReserveData>> {
    const query = this.db
      .select({
        referenceId: reserves.referenceId,
        stockId: reserves.stockId,
        qty: reserves.qty,
      })
      .from(reserves)
      .where(eq(reserves.referenceId, referenceId));

    const rows =
      this.lock.current() === 'for_update'
        ? await query.for('update')
        : await query;

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

  withLock<T>(fn: () => Promise<T>): Promise<T> {
    return this.lock.run('for_update', fn);
  }
}
