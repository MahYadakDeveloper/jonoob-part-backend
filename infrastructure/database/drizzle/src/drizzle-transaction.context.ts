import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { AsyncLocalStorage } from 'async_hooks';
import type { Database, DbTransaction } from './drizzle';
import { TablesRelationalConfig } from 'drizzle-orm';

@Injectable()
export class DrizzleTransactionContext<T extends TablesRelationalConfig = {}> {
  constructor(
    @InjectDrizzle()
    private readonly db: Database<T>,
    private readonly ctx: AsyncLocalStorage<DbTransaction<T>>,
  ) {}

  get current(): DbTransaction<T> | null {
    const tx = this.ctx.getStore();
    if (!tx) return null;
    return tx;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    // propagation = REQUIRED
    if (this.ctx.getStore()) {
      return fn();
    }

    return this.db.transaction(async (tx) => {
      return this.ctx.run(tx, fn);
    });
  }
}
