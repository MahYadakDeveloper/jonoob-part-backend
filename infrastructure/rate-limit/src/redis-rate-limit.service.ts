import { randomUUID } from 'node:crypto';
import { InjectRedis } from '@infra/db-redis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RATE_LIMIT_SCRIPT, RATE_LIMIT_SCRIPT_SHA } from './lua-scripts.constant';
import type {
  RateLimitConfig,
  RateLimitDecision,
  RateLimitRule,
} from './rate-limit';

const RATE_LIMIT_KEY_PREFIX = 'rate-limit:';

const MODE_CHECK = '0';
const MODE_CONSUME = '1';

/** [allowed, ruleIndex (1-based), remaining, limit, retryAfter] */
type ScriptReply = [0 | 1, number, number, number, number];

@Injectable()
export class RedisRateLimitService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  /**
   * Atomically checks ALL rules and consumes one unit from each of them
   * only if every rule allows the request. Rules may use different algorithms.
   */
  attempt(rules: RateLimitRule[]): Promise<RateLimitDecision> {
    return this.run(MODE_CONSUME, rules);
  }

  /** Same as `attempt` but never consumes anything. */
  check(rules: RateLimitRule[]): Promise<RateLimitDecision> {
    return this.run(MODE_CHECK, rules);
  }

  consume(key: string, config: RateLimitConfig): Promise<RateLimitDecision> {
    return this.attempt([{ key, config }]);
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(this.toRedisKey(key));
  }

  private async run(
    mode: typeof MODE_CHECK | typeof MODE_CONSUME,
    rules: RateLimitRule[],
  ): Promise<RateLimitDecision> {
    // Nothing to limit. Also protects the script from an empty KEYS array.
    if (rules.length === 0) {
      return {
        allowed: true,
        key: '',
        remaining: Number.POSITIVE_INFINITY,
        limit: Number.POSITIVE_INFINITY,
        retryAfter: 0,
      };
    }

    assertValidRules(rules);

    const keys = rules.map((r) => this.toRedisKey(r.key));
    const args = [mode, randomUUID(), ...rules.flatMap((r) => encode(r.config))];

    const reply = await this.evalScript(keys, args);
    const [allowed, index, remaining, limit, retryAfter] = parseReply(reply);

    const rule = rules[index - 1];
    if (!rule) {
      throw new Error(`Rate limit script returned invalid rule index: ${index}`);
    }

    return { allowed, key: rule.key, remaining, limit, retryAfter };
  }

  /** EVALSHA (script body is sent once), falling back to EVAL on NOSCRIPT. */
  private async evalScript(keys: string[], args: string[]): Promise<unknown> {
    try {
      return await this.redis.evalsha(
        RATE_LIMIT_SCRIPT_SHA,
        keys.length,
        ...keys,
        ...args,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('NOSCRIPT')) {
        return this.redis.eval(RATE_LIMIT_SCRIPT, keys.length, ...keys, ...args);
      }
      throw error;
    }
  }

  private toRedisKey(key: string): string {
    return `${RATE_LIMIT_KEY_PREFIX}${key}`;
  }
}

function encode(config: RateLimitConfig): string[] {
  switch (config.algorithm) {
    case 'token-bucket':
      return [
        config.algorithm,
        String(config.maxTokens),
        String(config.refillRate),
      ];
    case 'fixed-window':
    case 'sliding-window-log':
    case 'sliding-window-counter':
      return [config.algorithm, String(config.limit), String(config.windowSeconds)];
  }
}

function assertValidRules(rules: RateLimitRule[]): void {
  const seen = new Set<string>();

  for (const { key, config } of rules) {
    if (!key) throw new RangeError('Rate limit key must not be empty');

    // The same key twice would be evaluated against the same state and
    // consumed twice by the script.
    if (seen.has(key)) {
      throw new RangeError(`Duplicate rate limit key in one attempt: ${key}`);
    }
    seen.add(key);

    if (config.algorithm === 'token-bucket') {
      assertPositive(config.maxTokens, `${key}: maxTokens`);
      assertPositive(config.refillRate, `${key}: refillRate`);
    } else {
      assertPositive(config.windowSeconds, `${key}: windowSeconds`);
      if (!Number.isInteger(config.limit) || config.limit < 1) {
        throw new RangeError(`${key}: limit must be an integer >= 1`);
      }
    }
  }
}

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number > 0`);
  }
}

function parseReply(reply: unknown): [boolean, number, number, number, number] {
  if (!Array.isArray(reply) || reply.length !== 5) {
    throw new Error('Unexpected reply from rate limit script');
  }
  const [allowed, index, remaining, limit, retryAfter] = reply as ScriptReply;
  return [allowed === 1, index, remaining, limit, retryAfter];
}
