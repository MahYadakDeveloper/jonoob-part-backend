import { InjectRedis } from '@infra/db-redis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  ATTEMPT_SCRIPT,
  CHECK_LUA_SCRIPT,
  CONSUME_LUA_SCRIPT,
} from './lua-scripts.constant';
import {
  RateLimitResult,
  RateLimitResults,
  TokenBucketConfig,
} from './rate-limit';

const RATE_LIMIT_KEY_PREFIX = 'rate-limit:';

// Matches the Lua return shape. For rejections the 2nd element is the
// 1-based index of the failing bucket (not its key).
type AttemptScriptResult = [1, number] | [0, number, number, number, number];

@Injectable()
export class TokenBucketRateLimitService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  async attempt(
    buckets: { key: string; config: TokenBucketConfig }[],
  ): Promise<RateLimitResults> {
    // Nothing to limit. Also protects the Lua script from an empty KEYS array.
    if (buckets.length === 0) {
      return { allowed: true, remaining: Number.POSITIVE_INFINITY };
    }

    const now = Date.now() / 1000; // seconds with fractional precision

    const keys = buckets.map((b) => this.toRedisKey(b.key));
    const args = [
      now.toString(),
      ...buckets.flatMap((b) => [
        b.config.maxTokens.toString(),
        b.config.refillRate.toString(),
      ]),
    ];

    const result = (await this.redis.eval(
      ATTEMPT_SCRIPT,
      keys.length,
      ...keys,
      ...args,
    )) as AttemptScriptResult;

    if (result[0] === 1) {
      return { allowed: true, remaining: result[1] };
    }

    const [, failedIndex, remaining, limit, retryAfter] = result;

    const failedBucket = buckets[failedIndex - 1];
    if (!failedBucket) {
      throw new Error(
        `Rate limit script returned invalid bucket index: ${failedIndex}`,
      );
    }

    return {
      allowed: false,
      bucketKey: failedBucket.key,
      remaining,
      limit,
      retryAfter,
    };
  }

  async consume(
    key: string,
    config: TokenBucketConfig,
  ): Promise<RateLimitResult> {
    const { maxTokens, refillRate } = config;

    const now = Date.now() / 1000; // seconds with fractional precision
    const keys = [this.toRedisKey(key)];
    const args = [maxTokens.toString(), refillRate.toString(), now.toString()];

    const result = (await this.redis.eval(
      CONSUME_LUA_SCRIPT,
      keys.length,
      ...keys,
      ...args,
    )) as [0 | 1, number, number];

    const allowed = result[0] === 1;
    const remaining = result[1];
    const retryAfter = result[2];

    return { allowed, remaining, limit: maxTokens, retryAfter };
  }

  async check(
    key: string,
    config: TokenBucketConfig,
  ): Promise<RateLimitResult> {
    const { maxTokens, refillRate } = config;
    const now = Date.now() / 1000; // seconds with fractional precision

    const keys = [this.toRedisKey(key)];

    const args = [maxTokens.toString(), refillRate.toString(), now.toString()];

    const result = (await this.redis.eval(
      CHECK_LUA_SCRIPT,
      keys.length,
      ...keys,
      ...args,
    )) as [number, number];

    const remaining = result[0];
    const retryAfter = result[1];
    const allowed = remaining >= 1;

    return { allowed, remaining, limit: maxTokens, retryAfter };
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(this.toRedisKey(key));
  }

  private toRedisKey(key: string): string {
    return `${RATE_LIMIT_KEY_PREFIX}${key}`;
  }
}
