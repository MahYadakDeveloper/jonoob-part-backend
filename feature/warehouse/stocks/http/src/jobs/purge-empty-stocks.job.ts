import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  EmptyStocksPurgeRepository,
  type PurgeBatchOptions,
  type StockFkRef,
} from './empty-stocks-purge.repository';

const PG_FOREIGN_KEY_VIOLATION = '23503';

const BATCH: PurgeBatchOptions = {
  batchSize: 500,
  graceDays: 30,
  statementTimeoutMs: 30_000,
};
const MAX_BATCHES_PER_RUN = 20;

const pgCode = (e: unknown): string | undefined =>
  (e as { cause?: { code?: string }; code?: string })?.cause?.code ??
  (e as { code?: string })?.code;

/**
 * Deletes stocks that stayed empty past the grace period and have no
 * referencing rows. Safe to run on several instances at once: batches use
 * FOR UPDATE SKIP LOCKED, and the FK (restrict) is the last line of defence.
 *
 * Stocks referenced by history (e.g. movement items) are never purged.
 */
@Injectable()
export class PurgeEmptyStocksJob {
  private readonly logger = new Logger(PurgeEmptyStocksJob.name);
  private running = false;

  constructor(private readonly repo: EmptyStocksPurgeRepository) {}

  @Cron('0 3 * * *')
  async handle(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const count = await this.run();
      this.logger.log(`purged ${count} empty stocks`);
    } catch (e) {
      this.logger.error(`purge failed: ${String(e)}`);
    } finally {
      this.running = false;
    }
  }

  async run(): Promise<number> {
    const refs = await this.repo.findReferences();
    let total = 0;

    for (let i = 0; i < MAX_BATCHES_PER_RUN; i++) {
      const ids = await this.deleteBatch(refs);
      total += ids.length;
      if (ids.length > 0) await this.afterDeleted(ids);
      if (ids.length < BATCH.batchSize) break;
    }
    return total;
  }

  /** A child row committed mid-batch: the batch rolled back, retry next run. */
  private async deleteBatch(refs: StockFkRef[]): Promise<string[]> {
    try {
      return await this.repo.deleteEmptyBatch(refs, BATCH);
    } catch (e) {
      if (pgCode(e) !== PG_FOREIGN_KEY_VIOLATION) throw e;
      this.logger.warn('batch rolled back: a referencing row appeared concurrently');
      return [];
    }
  }

  /** Runs after commit: purge caches, publish events. Prefer an outbox for guarantees. */
  protected async afterDeleted(ids: string[]): Promise<void> {
    try {
      // TODO: invalidate external references to these labels
      await Promise.resolve(ids);
    } catch (e) {
      this.logger.warn(`afterDeleted failed for ${ids.length} stocks: ${String(e)}`);
    }
  }
}
