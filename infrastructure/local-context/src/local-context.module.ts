import { Module } from '@nestjs/common';
import { AsyncLocalTransactionContext } from './async-local-transaction-context';
import { AsyncLocalDbLockContext } from './lock-context';

@Module({
  providers: [
    {
      provide: 'DbLockContext',
      useClass: AsyncLocalDbLockContext,
    },
    {
      provide: 'TransactionContext',
      useClass: AsyncLocalTransactionContext,
    },
  ],
  exports: ['DbLockContext', 'TransactionContext'],
})
export class LocalContextModule {}
