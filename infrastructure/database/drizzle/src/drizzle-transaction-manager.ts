import { type TransactionContext, TransactionManager } from '@feature/common';
import { Inject, Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { Database, Transaction } from './drizzle';

@Injectable()
export class DrizzleTransactionManager implements TransactionManager<Transaction> {
  constructor(
    @InjectDrizzle()
    private readonly db: Database,
    @Inject('TransactionContext')
    private readonly txContext: TransactionContext<Transaction>,
  ) {}
  current(): Transaction | null {
    const ctx = this.txContext.current();
    if (!ctx) return null;
    return ctx;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    // propagation = REQUIRED
    if (this.txContext.current()) {
      return fn();
    }

    return this.db.transaction(async (tx) => {
      return this.txContext.run(tx, fn);
    });
  }
}
