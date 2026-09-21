import { TransactionManager } from '@feature/common';
import { AsyncLocalTransactionContext } from '@infra/transaction';
import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_DB } from './prisma.tokens';
import type { PrismaDbClient, PrismaTransaction } from './prisma.types';

@Injectable()
export class PrismaTransactionManager implements TransactionManager {
  constructor(
    @Inject(PRISMA_DB)
    private readonly db: PrismaDbClient,
    private readonly txContext: AsyncLocalTransactionContext<PrismaTransaction>,
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
