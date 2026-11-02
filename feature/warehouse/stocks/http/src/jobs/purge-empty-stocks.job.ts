import { DrizzleBaseRepository } from '@infra/db-drizzle';
import { stocks } from '@infra/schema/warehouse/stocks.schema';
import { and, asc, eq, inArray, notExists, sql } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
// import { stockMovements } from './stock-movements.schema';  // your child tables

/**
 * EVERY table that has a foreign key to stocks.id must be listed here. This is only an optimization: if you forget one,
 * the FK (onDelete: 'restrict') still blocks the delete and the job falls back to per-row deletes, so data is never
 * corrupted, but the job gets slower and noisier.
 */
const REFERENCES: Array<{ table: PgTable; column: PgColumn }> = [
  // { table: stockMovements, column: stockMovements.stockId },
];

const PG_FOREIGN_KEY_VIOLATION = '23503';
const ADVISORY_LOCK_KEY = 7_302_001; // any constant unique to this job

const pgCode = (e: unknown): string | undefined =>
  (e as { cause?: { code?: string }; code?: string })?.cause?.code ??
  (e as { code?: string })?.code;

export class PurgeEmptyStocksJob extends DrizzleBaseRepository {
  constructor(
    private readonly options: {
      batchSize?: number;
      maxBatchesPerRun?: number;
      /** Called AFTER commit with the deleted stock ids: purge caches, publish events, etc. */
      onDeleted?: (ids: string[]) => Promise<void>;
    } = {},
  ) {
    super();
  }

  private get batchSize() {
    return this.options.batchSize ?? 500;
  }

  // Candidate = zero quantity AND no row in any referencing table.
  private candidateWhere() {
    return and(
      eq(stocks.quantity, 0),
      ...REFERENCES.map((r) =>
        notExists(
          this.db
            .select({ one: sql`1` })
            .from(r.table)
            .where(eq(r.column, stocks.id)),
        ),
      ),
    );
  }

  /** Runs batches until nothing is left (or the per-run cap is reached). Returns deleted count. */
  async run(): Promise<number> {
    const maxBatches = this.options.maxBatchesPerRun ?? 20;
    let total = 0;

    for (let i = 0; i < maxBatches; i++) {
      const ids = await this.deleteBatchSafely();
      if (ids === null) break; // another instance is running
      total += ids.length;
      if (ids.length > 0) await this.options.onDeleted?.(ids);
      if (ids.length < this.batchSize) break;
    }
    return total;
  }

  private async deleteBatchSafely(): Promise<string[] | null> {
    try {
      return await this.deleteBatch();
    } catch (e) {
      if (pgCode(e) !== PG_FOREIGN_KEY_VIOLATION) throw e;
      // A reference appeared (race) or is missing from REFERENCES: go row by row.
      return this.deleteRowByRow();
    }
  }

  /**
   * One short transaction:
   *
   * - advisory lock so only one instance runs the job at a time
   * - FOR UPDATE SKIP LOCKED: skip rows another transaction is touching (e.g. add_stock_quantity incrementing them)
   * - the delete re-checks quantity = 0 A concurrent insert of a referencing row is stopped by the FK (restrict).
   */
  private async deleteBatch(): Promise<string[] | null> {
    return this.db.transaction(async (tx) => {
      const lock = await tx.execute<{ locked: boolean }>(
        sql`SELECT pg_try_advisory_xact_lock(${ADVISORY_LOCK_KEY}) AS locked`,
      );
      if (!lock.rows[0].locked) return null;

      const candidates = await tx
        .select({ seq: stocks.seq })
        .from(stocks)
        .where(this.candidateWhere())
        .orderBy(asc(stocks.seq))
        .limit(this.batchSize)
        .for('update', { skipLocked: true });

      if (candidates.length === 0) return [];

      const deleted = await tx
        .delete(stocks)
        .where(
          and(
            inArray(
              stocks.seq,
              candidates.map((c) => c.seq),
            ),
            eq(stocks.quantity, 0),
          ),
        )
        .returning({ id: stocks.id });

      return deleted.map((d) => d.id);
    });
  }

  /** Fallback: each delete is its own statement; referenced rows are skipped. */
  private async deleteRowByRow(): Promise<string[]> {
    const candidates = await this.db
      .select({ seq: stocks.seq })
      .from(stocks)
      .where(this.candidateWhere())
      .orderBy(asc(stocks.seq))
      .limit(this.batchSize);

    const deletedIds: string[] = [];
    for (const { seq } of candidates) {
      try {
        const [row] = await this.db
          .delete(stocks)
          .where(and(eq(stocks.seq, seq), eq(stocks.quantity, 0)))
          .returning({ id: stocks.id });
        if (row) deletedIds.push(row.id);
      } catch (e) {
        if (pgCode(e) !== PG_FOREIGN_KEY_VIOLATION) throw e;
        // referenced: leave it
      }
    }
    return deletedIds;
  }
}

/*
 * Scheduling (NestJS example):
 *
 *   @Cron('0 3 * * *')
 *   async handle() {
 *     const count = await this.job.run();
 *     this.logger.log(`purged ${count} empty stocks`);
 *   }
 */
