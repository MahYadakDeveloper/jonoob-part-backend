import { AsyncLocalStorage } from 'async_hooks';
import { Database, DbTransaction } from '../drizzle';
import { DrizzleDbProvider } from '../drizzle-db-provider';

export abstract class DrizzleBaseRepository {
  constructor(
    protected readonly dbProvider: DrizzleDbProvider,
    protected readonly lockContext: AsyncLocalStorage<'for_update'>,
  ) {}

  protected get db(): Database | DbTransaction {
    return this.dbProvider.current;
  }

  protected get lockMode() {
    return this.lockContext.getStore();
  }

  withForUpdate<T>(fn: () => Promise<T>): Promise<T> {
    this.assertTransaction(this.dbProvider.current);

    return this.lockContext.run('for_update', fn);
  }

  /** Drizzle's `tx` has rollback(); the database itself doesn't, and would write outside the transaction. */
  private assertTransaction(tx: Database | DbTransaction) {
    if (
      typeof (tx as Partial<DbTransaction> | undefined)?.rollback !== 'function'
    ) {
      throw new Error('withForUpdate must run inside a transaction');
    }
  }
}
