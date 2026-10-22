import { Inject } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { sql, TablesRelationalConfig } from 'drizzle-orm';
import { Database, DbTransaction } from './drizzle';
import { DrizzleTransactionContext } from './drizzle-transaction.context';

export abstract class DrizzleBaseRepository<
  TRelations extends TablesRelationalConfig = {},
> {
  @Inject()
  private readonly transactionCtx: DrizzleTransactionContext<TRelations>;
  @Inject('DRIZZLE_ALS_FOR_UPDATE')
  private readonly forUpdateCtx: AsyncLocalStorage<'for_update'>;

  protected get db(): Database<TRelations> | DbTransaction<TRelations> {
    return this.transactionCtx.current ?? this.db;
  }

  protected get ranForUpdate() {
    return this.forUpdateCtx.getStore() === 'for_update';
  }

  protected transaction<T>(fn: (tx: DbTransaction<TRelations>) => Promise<T>) {
    const curr = this.transactionCtx.current;
    if (curr) return fn(curr);

    return this.db.transaction((tx) => fn(tx));
  }

  withForUpdate<T>(fn: () => Promise<T>): Promise<T> {
    assertTransaction(this.db, 'withForUpdate');

    return this.forUpdateCtx.run('for_update', fn);
  }

  async withLock<T>(
    namespace: string,
    key: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    await this.lock(namespace, key);
    return fn();
  }

  protected async lock(namespace: string, key: string): Promise<void> {
    assertTransaction(this.db, 'withLock');

    // timeout
    // await this.db.execute(sql`SET LOCAL lock_timeout = '5s'`);

    await this.db.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${namespace + ':' + key}, 0))`,
    );
  }
}

/** Drizzle's `tx` has rollback(); the database itself doesn't, and would write outside the transaction. */
function assertTransaction(tx: any, caller: string) {
  if (
    typeof (tx as Partial<DbTransaction<{}>> | undefined)?.rollback !==
    'function'
  ) {
    throw new Error(`${caller} must run inside a transaction`);
  }
}
