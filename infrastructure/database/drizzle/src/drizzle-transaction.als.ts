import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { TablesRelationalConfig } from 'drizzle-orm';
import { LockStrength } from 'drizzle-orm/pg-core';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Database, DbTransaction } from './drizzle';

interface TxStore<S extends TablesRelationalConfig> {
  tx: DbTransaction<S>;
  lock: LockStrength | null;
}

export type LockFn = <R>(
  strength: LockStrength,
  fn: () => Promise<R>,
) => Promise<R>;

@Injectable()
export class DrizzleTransactionAls<S extends TablesRelationalConfig = {}> {
  private readonly als = new AsyncLocalStorage<TxStore<S>>();

  constructor(@InjectDrizzle() private readonly db: Database<S>) {}

  get current(): DbTransaction<S> | null {
    return this.als.getStore()?.tx ?? null;
  }

  get lock(): LockStrength | null {
    return this.als.getStore()?.lock ?? null;
  }

  /**
   * Joins the current transaction or opens a new one (propagation = REQUIRED).
   * `lock` runs `fn` in the same transaction with the given lock strength
   * applied to `applyLockConditionally` calls inside `fn`.
   */
  async run<R>(fn: (lock: LockFn) => Promise<R>): Promise<R> {
    const existing = this.als.getStore();
    if (existing) return fn(this.createLock(existing));

    return this.db.transaction((tx) => {
      const store: TxStore<S> = { tx, lock: null };
      return this.als.run(store, () => fn(this.createLock(store)));
    });
  }

  private createLock(store: TxStore<S>): LockFn {
    return (strength, fn) => this.als.run({ ...store, lock: strength }, fn);
  }
}
