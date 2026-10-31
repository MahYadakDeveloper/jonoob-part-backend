export type RateLimitAlgorithm =
  | 'token-bucket'
  | 'fixed-window'
  | 'sliding-window-log'
  | 'sliding-window-counter';

export interface TokenBucketConfig {
  algorithm: 'token-bucket';
  /** Bucket capacity = max burst size. */
  maxTokens: number;
  /** Refill speed, unit: tokens/second. */
  refillRate: number;
}

interface WindowConfigBase<A extends RateLimitAlgorithm> {
  algorithm: A;
  /** Max requests allowed inside one window. Integer >= 1. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/** Counter that resets when its window expires (window starts at the first request). */
export type FixedWindowConfig = WindowConfigBase<'fixed-window'>;
/** Exact: stores one timestamp per accepted request (memory O(limit)). */
export type SlidingWindowLogConfig = WindowConfigBase<'sliding-window-log'>;
/** Approximate: weighted sum of previous and current window (memory O(1)). */
export type SlidingWindowCounterConfig =
  WindowConfigBase<'sliding-window-counter'>;

export type RateLimitConfig =
  | TokenBucketConfig
  | FixedWindowConfig
  | SlidingWindowLogConfig
  | SlidingWindowCounterConfig;

export interface RateLimitRule {
  /** Logical key (without the service prefix), e.g. `otp:verify:<challengeId>`. */
  key: string;
  config: RateLimitConfig;
}

export interface RateLimitDecision {
  allowed: boolean;
  /**
   * allowed = true  -> key of the tightest rule (the one with the fewest requests left)
   * allowed = false -> key of the rule that rejected (the one with the longest wait)
   */
  key: string;
  /** Requests left in that rule (after consuming, for `attempt`/`consume`). */
  remaining: number;
  /** Configured maximum of that rule. */
  limit: number;
  /** Seconds until the client may retry. 0 when allowed. */
  retryAfter: number;
}
