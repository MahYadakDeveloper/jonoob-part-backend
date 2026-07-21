import { TransactionContext } from "@feature/common";
import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

@Injectable()
export class AsyncLocalTransactionContext<
  TClient,
> implements TransactionContext<TClient> {
  private readonly storage = new AsyncLocalStorage<TClient>();

  current(): TClient | null {
    return this.storage.getStore() ?? null;
  }

  run<T>(client: TClient, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(client, fn);
  }
}
