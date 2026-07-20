import { ITransactionManager } from "@feature/common";
import { AsyncLocalTransactionContext } from "@infra/transaction";
import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "./generated/prisma/client";

@Injectable()
export class PrismaTransactionManager implements ITransactionManager {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly txContext: AsyncLocalTransactionContext<Prisma.TransactionClient>,
  ) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    // propagation = REQUIRED
    if (this.txContext.current()) {
      return fn();
    }

    return this.prisma.$transaction(
      async (tx) => {
        return this.txContext.run(tx, fn);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10_000,
        maxWait: 5_000,
      },
    );
  }
}
