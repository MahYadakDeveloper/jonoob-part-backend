import { DbLockContext, DbLockMode } from '@infra/persistent-common';
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

@Injectable()
export class AsyncLocalDbLockContext implements DbLockContext {
  private readonly storage = new AsyncLocalStorage<DbLockMode>();

  current(): DbLockMode | undefined {
    return this.storage.getStore();
  }

  run<T>(mode: DbLockMode, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(mode, fn);
  }
}
