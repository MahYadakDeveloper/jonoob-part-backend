import { DbProvider } from '@feature/common';
import { AsyncLocalTransactionContext } from '@infra/local-context';
import { Inject, Injectable } from '@nestjs/common';
import type { PrismaDbClient, PrismaDbContext, PrismaTransaction } from './prisma.types';

@Injectable()
export class PrismaDbProvider implements DbProvider<PrismaDbClient> {
  constructor(
    @Inject('PrismaDbClient')
    private readonly db: PrismaDbClient,
    private readonly txContext: AsyncLocalTransactionContext<PrismaTransaction>,
  ) {}

  current(): PrismaDbContext {
    return this.txContext.current() ?? this.db;
  }
}
