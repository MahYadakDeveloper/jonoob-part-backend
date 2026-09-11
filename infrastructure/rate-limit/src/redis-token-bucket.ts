import { RateLimitResult, RateLimitService, TokenBucketConfig } from '@feature/auth-rate-limit';
import { REDIS_CLIENT } from '@infra/db-redis';
import { Inject } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { CHECK_LUA_SCRIPT, CONSUME_TOKEN_LUA_SCRIPT } from './lua-script.constant';

export class RedisTokenBucketBasedRateLimitService implements RateLimitService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: RedisClientType,
  ) {}

  attempt(
    limits: { key: string; options: TokenBucketConfig }[],
  ): Promise<Record<string, RateLimitResult>> {
    // [TODO]
    throw new Error('Method not implemented.');
  }

  async consume(key: string, config: TokenBucketConfig): Promise<RateLimitResult> {
    const { maxTokens, refillRate } = config;

    const now = Date.now() / 1000; // seconds with fractional precision

    const result = (await this.redis.eval(CONSUME_TOKEN_LUA_SCRIPT, {
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
