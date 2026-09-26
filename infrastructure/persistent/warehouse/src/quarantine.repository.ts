import { type DbProvider } from '@feature/common';
import {
  QuarantinedStock,
  StockQuarantineRepository,
} from '@feature/warehouse-quarantine';
import { BaseRepository, type DbLockContext } from '@infra/persistent-common';
import { Inject } from '@nestjs/common';
import { EmptyRelations, eq, sql } from 'drizzle-orm';
import { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';
import { quarantines } from './schema/quarantine';

export class DrizzleStockQuarantineRepository
  extends BaseRepository<NodePgDatabase | NodePgTransaction<EmptyRelations>>
  implements StockQuarantineRepository
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

  findAll(): Promise<QuarantinedStock[]> {
    return this.db
      .select({
        id: quarantines.id,
        stockId: quarantines.stockId,
        referenceId: quarantines.referenceId,
        reason: quarantines.reason,
        qty: quarantines.qty,
      })
      .from(quarantines);
  }

  async quarantine(stock: QuarantinedStock[]): Promise<void> {
    await this.db.insert(quarantines).values(stock);
  }

  async release(items: { id: string; qty: number }[]): Promise<void> {
    for (const quarantine of items) {
      const current = await this.db
        .select({
          id: quarantines.id,
          qty: quarantines.qty,
        })
        .from(quarantines)
        .where(eq(quarantines.id, quarantine.id))
        .for('update')
        .then((rows) => rows[0]);

      if (!current) {
        throw new Error();
      }

      if (quarantine.qty > current.qty) {
        throw new Error();
      }

      if (quarantine.qty === current.qty) {
        await this.db
          .delete(quarantines)
          .where(eq(quarantines.id, quarantine.id));

        continue;
      }

      await this.db
        .update(quarantines)
        .set({
          qty: sql`${quarantines.qty} - ${quarantine.qty}`,
        })
        .where(eq(quarantines.id, quarantine.id));
    }
  }
}
