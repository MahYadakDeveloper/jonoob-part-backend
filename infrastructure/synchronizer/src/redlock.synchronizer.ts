import { REDIS_CLIENT } from '@infra/db-redis';
import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { createLock, NodeRedisAdapter } from 'redlock-universal';

@Injectable()
export class RedlockSynchronizer {
  private readonly adapter: NodeRedisAdapter;

  constructor(@Inject(REDIS_CLIENT) client: RedisClientType) {
    this.adapter = new NodeRedisAdapter(client);
  }

  async executeExclusive<T>(
    key: string,
    callback: () => Promise<T>,
    ttlMs = 5000,
  ): Promise<T> {
    const lock = createLock({ adapter: this.adapter, key, ttl: ttlMs });

    const handle = await lock.acquire();
    try {
      return await callback();
    } finally {
      await lock.release(handle);
    }
  }
}
