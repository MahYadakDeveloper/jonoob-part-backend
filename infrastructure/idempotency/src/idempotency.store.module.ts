import { RedisModule } from '@infra/db-redis';
import { Module } from '@nestjs/common';
import { RedisIdempotencyStore } from './redis-idempotency.store';

/**
 * Infrastructure side of idempotency: only WHERE records are kept.
 *
 * It does not configure the behavior (scope, ttl, encryption, ...). That
 * belongs to the app layer, where `IdempotencyModule.forRootAsync()` is
 * registered next to the guards that set `req.user`.
 *
 * Importing this module is enough: Nest creates the store at startup, and its
 * constructor registers it with `IdempotencyStorage` (exported by the global
 * `IdempotencyModule`). Requires a global provider under `REDIS_CLIENT`.
 */
@Module({
  imports: [RedisModule],
  providers: [RedisIdempotencyStore],
  exports: [RedisIdempotencyStore],
})
export class IdempotencyStoreModule {}
