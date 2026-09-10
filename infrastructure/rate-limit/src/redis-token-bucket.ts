import { RateLimitResult, RateLimitService, TokenBucketConfig } from '@feature/auth-rate-limit';
import { REDIS_CLIENT } from '@infra/db-redis';
import { Inject } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { LUA_SCRIPT } from './lua-script.constant';

export class RedisTokenBucketBasedRateLimitService implements RateLimitService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: RedisClientType,
  ) {}

  async consume(key: string, config: TokenBucketConfig): Promise<RateLimitResult> {
    const { maxTokens, refillRate } = config;

    const now = Date.now() / 1000; // seconds with fractional precision

    const result = (await this.redis.eval(LUA_SCRIPT, {
      keys: [key],
      arguments: [maxTokens.toString(), refillRate.toString(), now.toString()],
    })) as number[];

    const allowed = result[0] === 1;
    const remaining = result[1];

    let retryAfter: number | null = null;
    if (!allowed) {
      retryAfter = Math.ceil(1 / refillRate);
    }

    return { allowed, remaining, limit: maxTokens, retryAfter };
  }
  reset(key: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
