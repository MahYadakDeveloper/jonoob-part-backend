import { Inject } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { sql, TablesRelationalConfig } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { AsyncLocalStorage } from 'node:async_hooks';
import { type Database, DbTransaction } from './drizzle';
import { DrizzleTransactionContext } from './drizzle-transaction.context';

export abstract class DrizzleBaseRepository<
  TRelations extends TablesRelationalConfig = {},
> {
  @InjectDrizzle()
  private readonly _db: Database<TRelations>;
  @Inject()
  private readonly transactionCtx: DrizzleTransactionContext<TRelations>;
  @Inject('FOR_UPDATE_ALS')
  private readonly forUpdateCtx: AsyncLocalStorage<'for_update'>;

  protected get db(): Database<TRelations> | DbTransaction<TRelations> {
    return this.transactionCtx.current ?? this._db;
  }

  protected get ranForUpdate() {
    return this.forUpdateCtx.getStore() === 'for_update';
  }

  protected transaction<T>(fn: (tx: DbTransaction<TRelations>) => Promise<T>) {
    const curr = this.transactionCtx.current;
    if (curr) return fn(curr);

    return this._db.transaction((tx) => fn(tx));
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

  /**
   * Conditionally appends `FOR UPDATE` to the query when the current
   * transaction runs in "lock for update" mode (`this.ranForUpdate === true`).
   * Otherwise the query is returned unchanged.
   *
   * ## Choosing which tables get locked (`of`)
   * - If `of` is omitted, `FOR UPDATE` applies to **all tables in `FROM` and
   *   `JOIN`**.
   * - If the query uses `leftJoin`/`innerJoin` and you do not need to lock the
   *   joined table (e.g. you only want to lock the stock row, not its
   *   reservations), you **must** explicitly specify the table to lock via `of`.
   * - `of` only accepts tables that appear directly in the query's
   *   `FROM`/`JOIN`. Tables inside a subquery cannot be locked with `of`, and
   *   passing a table that is not in the query makes Postgres fail with
   *   `relation "x" in FOR UPDATE clause not found in FROM clause`.
   * - If you use an alias, pass the alias to `of`, not the original table.
   *
   * ## Restrictions
   * - **Do not use `groupBy`.** Postgres does not allow `FOR UPDATE` together
   *   with `GROUP BY` (nor `DISTINCT`, `HAVING`, or aggregate/window functions
   *   at the outer level). It fails with
   *   `FOR UPDATE is not allowed with GROUP BY clause`.
   *   Compute aggregates with a scalar subquery in `select` instead.
   * - The lock only covers rows of the outer-level tables; tables inside a
   *   scalar subquery are not locked.
   * - The lock lasts only until the end of the transaction, so this must run
   *   on a `tx` (not on a non-transactional connection).
   * - With `leftJoin`, locking the right (nullable) side is not allowed in
   *   Postgres (`FOR UPDATE cannot be applied to the nullable side of an outer
   *   join`). In that case always pass `of` with the left-side table.
   *
   * @param query A Drizzle select query that is awaitable and exposes `for`.
   * @param of Table(s) to lock (optional; default: all tables in the query).
   * @returns The same query, with `FOR UPDATE` applied if `ranForUpdate` is on.
   *
   * @example
   * // Only the stocks rows are locked, even though a join is present
   * const rows = await this.applyForUpdateConditionally(
   *   this.db
   *     .select()
   *     .from(stocks)
   *     .leftJoin(reservationItems, eq(stocks.id, reservationItems.stockId))
   *     .where(eq(stocks.id, id)),
   *   stocks,
   * );
   */
  protected applyForUpdateConditionally<R>(
    query: PromiseLike<R> & {
      for: (
        strength: 'update',
        config?: { of?: PgTable | PgTable[] },
      ) => PromiseLike<R>;
    },
    of?: PgTable | PgTable[],
  ): PromiseLike<R> {
    return this.ranForUpdate
      ? query.for('update', of ? { of } : undefined)
      : query;
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
