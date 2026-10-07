import { REDIS_CLIENT } from '@infra/db-redis';
import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';

export interface OtpRecord {
  /**
   * Hashed OTP value.
   *
   * Never store the raw OTP.
   */
  hash: string;
}

@Injectable()
export class OtpStore {
  private static readonly PREFIX = 'otp:';

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {}

  /**
   * Store a value.
   *
   * @param ttl Time-to-live in seconds.
   */
  async set(key: string, value: OtpRecord, ttl?: number): Promise<void> {
    const payload = JSON.stringify(value);

    if (ttl !== undefined) {
      if (!Number.isInteger(ttl) || ttl <= 0) {
        throw new RangeError('ttl must be a positive integer (seconds)');
      }
      await this.redis.set(this.k(key), payload, { EX: ttl });
      return;
    }

    await this.redis.set(this.k(key), payload);
  }

  async get(key: string): Promise<OtpRecord | null> {
    const raw = await this.redis.get(this.k(key));
    if (raw === null) return null;

    try {
      return JSON.parse(raw) as OtpRecord;
    } catch {
      // Corrupted entry: remove it so it can't block future OTPs.
      await this.redis.del(this.k(key));
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.k(key));
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(this.k(key))) === 1;
  }

  private k(key: string): string {
    return `${OtpStore.PREFIX}${key}`;
  }
}
