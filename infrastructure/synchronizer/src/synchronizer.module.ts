import { RedisModule } from '@infra/db-redis';
import { Module } from '@nestjs/common';
import { RedlockSynchronizer } from './redlock.synchronizer';

@Module({
  imports: [RedisModule],
  providers: [RedlockSynchronizer],
  exports: [RedlockSynchronizer],
})
export class SynchronizerModule {}
