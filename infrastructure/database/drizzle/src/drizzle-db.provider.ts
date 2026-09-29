import { DbProvider, type TransactionContext } from '@feature/common';
import { Inject, Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { EmptyRelations } from 'drizzle-orm';
import { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';
import type { Database, Transaction } from './drizzle';

@Injectable()
export class DrizzleDbProvider implements DbProvider<NodePgDatabase> {
  constructor(
    @InjectDrizzle()
    private readonly db: Database,
    @Inject('TransactionContext')
    private readonly txContext: TransactionContext<Transaction>,
  ) {}

  current(): NodePgDatabase | NodePgTransaction<EmptyRelations> {
    return this.txContext.current() ?? this.db;
  }
}
