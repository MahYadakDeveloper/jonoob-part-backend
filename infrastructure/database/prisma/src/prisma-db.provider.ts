import { DbProvider } from '@feature/common';
import { AsyncLocalTransactionContext } from '@infra/transaction';
import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_DB } from './prisma.tokens';
import type { PrismaDbClient, PrismaDbContext, PrismaTransaction } from './prisma.types';

@Injectable()
export class PrismaDbProvider implements DbProvider<PrismaDbClient> {
  constructor(
    @Inject(PRISMA_DB)
    private readonly db: PrismaDbClient,
    private readonly txContext: AsyncLocalTransactionContext<PrismaTransaction>,
  ) {}

  current(): PrismaDbContext {
    return this.txContext.current() ?? this.db;
  }
}
