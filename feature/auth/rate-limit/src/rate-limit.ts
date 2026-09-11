export type RateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      remaining: number; // how many requests are left in the current window/bucket
      limit: number; // the configured maximum
      retryAfter: number; // seconds until the client should retry (null if allowed)
    };

export interface TokenBucketConfig {
  /**
   * Maximum number of requests allowed
   * during the configured window.
   */
  maxTokens: number;

  /**
   * Rate of refilling with unit: token/sec
   */
  refillRate: number;
}

export interface RateLimitService {
  attempt(limits: { key: string; config: TokenBucketConfig }[]): Promise<RateLimitResult>;

  consume(key: string, options: TokenBucketConfig): Promise<RateLimitResult>;

  check(key: string, options: TokenBucketConfig): Promise<RateLimitResult>;

  reset(key: string): Promise<void>;
}
