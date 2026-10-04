import { AsyncLocalStorage } from 'async_hooks';
import { sql, TablesRelationalConfig } from 'drizzle-orm';
import { Database, DbTransaction } from './drizzle';
import { DrizzleDbProvider } from './drizzle-db-provider';

export abstract class DrizzleBaseRepository<
  TRelation extends TablesRelationalConfig = {},
> {
  constructor(
    protected readonly dbProvider: DrizzleDbProvider<TRelation>,
    protected readonly forUpdateCtx: AsyncLocalStorage<'for_update'>,
  ) {}

  protected get db(): Database<TRelation> | DbTransaction<TRelation> {
    return this.dbProvider.current;
  }

  protected get forUpdate() {
    return !!this.forUpdateCtx.getStore();
  }

  withForUpdate<T>(fn: () => Promise<T>): Promise<T> {
    assertTransaction(this.dbProvider.current, 'withForUpdate');

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
    assertTransaction(this.dbProvider.current, 'withLock');

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
