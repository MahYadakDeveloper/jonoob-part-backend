import { DbProvider, type TransactionContext } from '@feature/common';
import { Inject, Injectable } from '@nestjs/common';
import { EmptyRelations } from 'drizzle-orm';
import { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';

@Injectable()
export class DrizzleDbProvider implements DbProvider<NodePgDatabase> {
  constructor(
    @Inject('NodePgDatabase')
    private readonly db: NodePgDatabase,
    private readonly txContext: TransactionContext<
      NodePgTransaction<EmptyRelations>
    >,
  ) {}

  current(): NodePgDatabase | NodePgTransaction<EmptyRelations> {
    return this.txContext.current() ?? this.db;
  }
}
