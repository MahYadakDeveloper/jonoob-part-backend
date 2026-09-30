import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { Database, DbTransaction } from './drizzle';
import { DrizzleTransactionContext } from './drizzle-transaction';

@Injectable()
export class DrizzleDbProvider {
  constructor(
    @InjectDrizzle()
    private readonly db: Database,
    private readonly ctx: DrizzleTransactionContext,
  ) {}

  get current(): Database | DbTransaction {
    return this.ctx.current ?? this.db;
  }
}
