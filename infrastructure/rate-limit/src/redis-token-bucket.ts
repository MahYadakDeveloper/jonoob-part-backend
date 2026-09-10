import { RateLimitResult, RateLimitService, TokenBucketConfig } from '@feature/auth-rate-limit';
import { LUA_SCRIPT } from './lua-script.constant';

export class RedisTokenBucketBasedRateLimitService implements RateLimitService {
  async consume(key: string, config: TokenBucketConfig): Promise<RateLimitResult> {
    const redis = await getClient();
    const { maxTokens, refillRate } = config;

    const now = Date.now() / 1000; // seconds with fractional precision

    const result = (await redis.eval(LUA_SCRIPT, {
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
