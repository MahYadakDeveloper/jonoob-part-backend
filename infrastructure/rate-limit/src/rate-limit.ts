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

export type RateLimitResults =
  | {
      allowed: true;
      /** Remaining tokens in the tightest bucket (Infinity if no buckets were given) */
      remaining: number;
    }
  | {
      allowed: false;
      bucketKey: string;
      remaining: number;
      limit: number;
      retryAfter: number; // seconds
    };

export interface TokenBucketConfig {
  /** Maximum number of requests allowed during the configured window. */
  maxTokens: number;

  /** Rate of refilling with unit: token/sec */
  refillRate: number;
}
