import { IDbProvider } from "@feature/common";
import { AsyncLocalTransactionContext } from "@infra/transaction";
import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "./generated/prisma/client";
import { PrismaDbClient } from "./prisma.types";

@Injectable()
export class PrismaDbProvider implements IDbProvider<PrismaDbClient> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly txContext: AsyncLocalTransactionContext<Prisma.TransactionClient>,
  ) {}

  current(): PrismaDbClient {
    return this.txContext.current() ?? this.prisma;
  }
}
