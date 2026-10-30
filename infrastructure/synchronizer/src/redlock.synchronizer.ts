import { InjectRedis } from '@infra/db-redis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { createLock, NodeRedisAdapter } from 'redlock-universal';

@Injectable()
export class RedlockSynchronizer {
  private readonly adapter: NodeRedisAdapter;

  constructor(@InjectRedis() client: Redis) {
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
