import { type TransactionContext, TransactionManager } from '@feature/common';
import { Inject, Injectable } from '@nestjs/common';
import { EmptyRelations } from 'drizzle-orm';
import type {
  NodePgDatabase,
  NodePgTransaction,
} from 'drizzle-orm/node-postgres';

@Injectable()
export class DrizzleTransactionManager implements TransactionManager {
  constructor(
    @Inject('DrizzleDbClient')
    private readonly db: NodePgDatabase,
    private readonly txContext: TransactionContext<
      NodePgTransaction<EmptyRelations>
    >,
  ) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    // propagation = REQUIRED
    if (this.txContext.current()) {
      return fn();
    }

    return this.db.transaction(async (tx) => {
      return this.txContext.run(tx, fn);
    });
  }
}
