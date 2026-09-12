import {
  RateLimitResult,
  RateLimitResults,
  RateLimitService,
  TokenBucketConfig,
} from '@feature/auth-rate-limit';
import { REDIS_CLIENT } from '@infra/db-redis';
import { Inject } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { ATTEMPT_SCRIPT, CHECK_LUA_SCRIPT, CONSUME_LUA_SCRIPT } from './lua-scripts.constant';

export class RedisTokenBucketBasedRateLimitService implements RateLimitService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: RedisClientType,
  ) {}

  async attempt(buckets: { key: string; config: TokenBucketConfig }[]): Promise<RateLimitResults> {
    const now = Date.now() / 1000; // seconds with fractional precision

    const result = (await this.redis.eval(ATTEMPT_SCRIPT, {
      keys: buckets.map((b) => b.key),
      arguments: [
        now.toString(),
        ...buckets.flatMap((b) => [b.config.maxTokens.toString(), b.config.refillRate.toString()]),
      ],
    })) as [1, number] | [0, string, number, number, number];

    if (result[0] === 1) {
      return {
        allowed: true,
      };
    }

    return {
      allowed: false,
      bucketKey: result[1],
      remaining: result[2],
      limit: result[3],
      retryAfter: result[4],
    };
  }

  async consume(key: string, config: TokenBucketConfig): Promise<RateLimitResult> {
    const { maxTokens, refillRate } = config;

    const now = Date.now() / 1000; // seconds with fractional precision

    const result = (await this.redis.eval(CONSUME_LUA_SCRIPT, {
      keys: [key],
      arguments: [maxTokens.toString(), refillRate.toString(), now.toString()],
    })) as number[];

    const allowed = result[0] === 1;
    const remaining = result[1];
    const retryAfter = result[2];

    return { allowed, remaining, limit: maxTokens, retryAfter };
  }

  async check(key: string, config: TokenBucketConfig): Promise<RateLimitResult> {
    const { maxTokens, refillRate } = config;
    const now = Date.now() / 1000; // seconds with fractional precision

    const result = (await this.redis.eval(CHECK_LUA_SCRIPT, {
      keys: [key],
      arguments: [maxTokens.toString(), refillRate.toString(), now.toString()],
    })) as number[];

    const remaining = result[1];
    const retryAfter = result[2];
    const allowed = remaining >= 1;

    return { allowed, remaining, limit: maxTokens, retryAfter };
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
