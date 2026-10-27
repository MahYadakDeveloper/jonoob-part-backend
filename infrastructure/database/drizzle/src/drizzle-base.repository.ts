import { Inject } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { TablesRelationalConfig } from 'drizzle-orm';
import { LockConfig, LockStrength } from 'drizzle-orm/pg-core';
import { assertLockable } from './assert-lockable';
import { type Database, DbTransaction } from './drizzle';
import { DrizzleTransactionAls } from './drizzle-transaction.als';

export abstract class DrizzleBaseRepository<
  TRelations extends TablesRelationalConfig = {},
> {
  @InjectDrizzle()
  private readonly database!: Database<TRelations>;

  @Inject(DrizzleTransactionAls)
  private readonly transactionAls!: DrizzleTransactionAls<TRelations>;

  /** Current transaction if any, otherwise the plain database. */
  protected get db(): Database<TRelations> | DbTransaction<TRelations> {
    return this.transactionAls.current ?? this.database;
  }

  /** Joins the current transaction or starts a new one. */
  protected transaction<R>(fn: () => Promise<R>): Promise<R> {
    return this.transactionAls.run(fn);
  }

  /**
   * Appends `FOR <strength>` when a lock is active in the current scope.
   * `of`: tables to lock; required for joins you don't want locked (and the nullable side of a leftJoin).
   * Not allowed with groupBy/DISTINCT/HAVING/aggregates. The query must be complete before the call.
   */
  protected applyLockConditionally<R>(
    query: PromiseLike<R> & {
      for: (strength: LockStrength, config?: LockConfig) => PromiseLike<R>;
    },
    of?: LockConfig['of'],
  ): PromiseLike<R> {
    const lock = this.transactionAls.lock;
    if (!lock) return query;

    if (!this.transactionAls.current) {
      throw new Error('Row lock requested outside of a transaction');
    }
    assertLockable(query, of);

    const tables = Array.isArray(of) ? of : of ? [of] : [];
    return query.for(lock, tables.length ? { of: tables } : undefined);
  }
}
