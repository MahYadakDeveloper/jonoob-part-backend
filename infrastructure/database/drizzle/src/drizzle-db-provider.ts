import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { TablesRelationalConfig } from 'drizzle-orm';
import type { Database, DbTransaction } from './drizzle';
import { DrizzleTransactionContext } from './drizzle-transaction.context';

@Injectable()
export class DrizzleDbProvider<T extends TablesRelationalConfig = {}> {
  constructor(
    @InjectDrizzle()
    private readonly db: Database<T>,
    private readonly ctx: DrizzleTransactionContext<T>,
  ) {}

  get current(): Database<T> | DbTransaction<T> {
    return this.ctx.current ?? this.db;
  }
}
