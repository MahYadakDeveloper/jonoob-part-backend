import { InjectRedis } from '@infra/db-redis'; // use the same import as in your rate-limit service
import { Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { ExpiresIn, expiresInToSeconds } from './utils/expires-in';

const AUTH_KEY_PREFIX = 'auth:';

/**
 * Generic TTL key-value store for auth data (OTP digests, revoked tokens, ...). It knows nothing about what is stored:
 * callers choose the key and value, and the TTL uses the same type as JwtSignOptions['expiresIn'].
 */
@Injectable()
export class AuthStore {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  /** Stores a value, overwriting any existing one and resetting its TTL. */
  async set(key: string, value: string, expiresIn: ExpiresIn): Promise<void> {
    await this.redis.set(
      this.toRedisKey(key),
      value,
      'EX',
      expiresInToSeconds(expiresIn),
    );
  }

  get(key: string): Promise<string | null> {
    return this.redis.get(this.toRedisKey(key));
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(this.toRedisKey(key))) === 1;
  }

  async setIfAbsent(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const res = await this.redis.set(key, value, 'EX', ttlSeconds, 'NX');
    return res === 'OK';
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.toRedisKey(key));
  }

  private toRedisKey(key: string): string {
    return `${AUTH_KEY_PREFIX}${key}`;
  }
}
