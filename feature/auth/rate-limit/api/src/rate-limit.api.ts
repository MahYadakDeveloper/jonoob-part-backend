export interface RateLimitKey {
  ip: string;
  phoneNumber: string;
}

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed
   * during the configured window.
   */
  limit: number;

  /**
   * Window duration in seconds.
   */
  windowSeconds: number;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed.
   */
  allowed: boolean;

  /**
   * Number of requests already consumed.
   */
  count: number;

  /**
   * Maximum allowed requests.
   */
  limit: number;

  /**
   * Remaining requests.
   */
  remaining: number;

  /**
   * Unix timestamp in milliseconds when
   * the current window expires.
   */
  resetAt: number;
}

export interface RateLimitService {
  check(key: RateLimitKey, options: RateLimitOptions): Promise<RateLimitResult>;

  consume(key: RateLimitKey, options: RateLimitOptions): Promise<RateLimitResult>;

  reset(key: RateLimitKey): Promise<void>;
}
