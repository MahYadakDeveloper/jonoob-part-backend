import { REDIS_CLIENT } from '@infra/db-redis';
import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  IdempotencyStorage,
  type IdempotencyAcquireResult,
  type IdempotencyStore,
  type IdempotencyStoredPayload,
} from '@nestjs/idempotency';
import type { RedisClientType } from 'redis';

/**
 * The only node-redis method this store needs. A connected node-redis client
 * (`createClient()`) satisfies it, and so does a small fake in unit tests.
 * node-redis takes the keys and arguments of a script as two string arrays.
 */
type RedisClient = Pick<RedisClientType, 'eval'>;

/** Optional settings. Provide them under `REDIS_IDEMPOTENCY_OPTIONS`. */
export interface RedisIdempotencyStoreOptions {
  /**
   * Prefix of every Redis key. Record keys are only unique inside one
   * service, so when several services share one Redis, give each its own
   * prefix.
   * @default 'idem:'
   */
  prefix?: string;
}

export const REDIS_IDEMPOTENCY_OPTIONS = Symbol('REDIS_IDEMPOTENCY_OPTIONS');

/* -------------------------------------------------------------------------- *
 *  Data model
 * -------------------------------------------------------------------------- *
 *
 *  One Redis hash per record, at  <prefix><scope>:<client key>[:<handler>]
 *
 *    state  'in-flight' while a handler runs, 'completed' afterwards
 *    fp     fingerprint of the request (scope + method + URL + body)
 *    owner  id of the attempt that holds the lock (fencing token);
 *           removed once the record is completed
 *    resp   the stored response as JSON; absent while in flight
 *
 *  Expiry is Redis's own TTL on the hash:
 *    - in flight:  `lockTtl` after the last renewal, so a crashed instance
 *                  frees the key by itself;
 *    - completed:  `ttl` after completion, how long a retry gets a replay.
 *
 *  Consequences:
 *    - "expired" and "does not exist" are the same thing, so there is no
 *      takeover statement and no cleanup job;
 *    - the clock is Redis's, not the API instances', so clock drift between
 *      instances cannot break lock ownership.
 *
 *  Every method is ONE Lua script. Redis runs a script atomically, with no
 *  other command interleaved: that is what makes "check the owner, then
 *  write" safe. Each script touches a single key, so it also works on
 *  Redis Cluster.
 * -------------------------------------------------------------------------- */

/**
 * KEYS[1] record key | ARGV[1] fingerprint | ARGV[2] owner | ARGV[3] lockTtl (ms)
 *
 * Creates the lock when no record exists (a free or already expired key).
 * Otherwise returns the existing record in the same round trip, so there is
 * no gap between "try to lock" and "read who holds it".
 *
 * Reply: {1}                          lock acquired
 *        {0, state, fp, resp | nil}   somebody else's lock or record
 */
const ACQUIRE = `
if redis.call('EXISTS', KEYS[1]) == 0 then
  redis.call('HSET', KEYS[1], 'state', 'in-flight', 'fp', ARGV[1], 'owner', ARGV[2])
  redis.call('PEXPIRE', KEYS[1], ARGV[3])
  return {1}
end
local r = redis.call('HMGET', KEYS[1], 'state', 'fp', 'resp')
return {0, r[1], r[2], r[3]}
`;

/**
 * KEYS[1] record key | ARGV[1] owner | ARGV[2] response (JSON) | ARGV[3] ttl (ms)
 *
 * Turns the owner's lock into a completed record. If the lock expired (the
 * key is gone) or another attempt took it over, HGET returns another value
 * and nothing is written. Reply: 1 on success, 0 otherwise.
 */
const COMPLETE = `
if redis.call('HGET', KEYS[1], 'owner') ~= ARGV[1] then return 0 end
redis.call('HSET', KEYS[1], 'state', 'completed', 'resp', ARGV[2])
redis.call('HDEL', KEYS[1], 'owner')
redis.call('PEXPIRE', KEYS[1], ARGV[3])
return 1
`;

/**
 * KEYS[1] record key | ARGV[1] owner
 *
 * Deletes the lock so a retry can run the handler again, but only if it is
 * still ours. Reply: 1 on success, 0 otherwise.
 */
const RELEASE = `
if redis.call('HGET', KEYS[1], 'owner') == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

/**
 * KEYS[1] record key | ARGV[1] owner | ARGV[2] lockTtl (ms)
 *
 * Renews our lock while the handler runs, but only if it is still ours.
 * Reply: 1 on success, 0 otherwise.
 */
const EXTEND = `
if redis.call('HGET', KEYS[1], 'owner') ~= ARGV[1] then return 0 end
redis.call('PEXPIRE', KEYS[1], ARGV[2])
return 1
`;

type AcquireReply =
  | [1]
  | [0, 'in-flight' | 'completed', string, string | null | undefined];

/**
 * Keeps idempotency records in Redis, through node-redis.
 *
 * Why Redis suits this store: a record is a small hash that Redis expires on
 * its own, and a hot key (a client retrying one payment every second) costs a
 * memory round trip instead of a row lock in the primary database.
 *
 * The price: Redis becomes a component whose data you must not lose.
 * Configure it with `maxmemory-policy noeviction`. Every idempotency record
 * has a TTL, so the `volatile-*` policies would evict them too, and an
 * evicted record is a double charge waiting to happen.
 */
@Injectable()
export class RedisIdempotencyStore implements IdempotencyStore {
  private readonly prefix: string;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    storage: IdempotencyStorage,
    @Optional()
    @Inject(REDIS_IDEMPOTENCY_OPTIONS)
    options?: RedisIdempotencyStoreOptions,
  ) {
    this.prefix = options?.prefix ?? 'idem:';
    // An app has one store. It registers from a singleton's constructor,
    // because the registry locks once IdempotencyModule initializes.
    storage.registerSource(this);
  }

  /**
   * Takes the lock on a free key, or reports the record that already exists.
   *
   * - `acquired`   the caller owns the key and must run the handler;
   * - `in-flight`  another attempt is running  -> the caller answers 409;
   * - `completed`  a result is stored          -> the caller replays it.
   *
   * The fingerprint comes back with the record, so the interceptor can tell a
   * genuine retry from the same key reused for another request (422).
   */
  async acquire(
    key: string,
    owner: string,
    fingerprint: string,
    lockTtl: number,
  ): Promise<IdempotencyAcquireResult> {
    const reply = (await this.run(
      ACQUIRE,
      key,
      fingerprint,
      owner,
      toWholeMs(lockTtl),
    )) as AcquireReply;

    if (reply[0] === 1) {
      return { state: 'acquired' };
    }

    const [, state, storedFingerprint, response] = reply;
    if (state === 'completed') {
      if (!response) {
        // Cannot happen through this store's scripts. Fail loudly rather
        // than run the handler again on a record we cannot read.
        throw new Error(
          `The completed idempotency record for "${key}" has no response`,
        );
      }
      return {
        state: 'completed',
        fingerprint: storedFingerprint,
        response: JSON.parse(response) as IdempotencyStoredPayload,
      };
    }
    return { state: 'in-flight', fingerprint: storedFingerprint };
  }

  /**
   * Stores the handler's result and keeps it for `ttl`, if `owner` still
   * holds the lock. `false` means the lock was lost (it expired and another
   * attempt took it over): the interceptor then reports a `lock-lost` event.
   */
  async complete(
    key: string,
    owner: string,
    response: IdempotencyStoredPayload,
    ttl: number,
  ): Promise<boolean> {
    const done = await this.run(
      COMPLETE,
      key,
      owner,
      JSON.stringify(response),
      toWholeMs(ttl),
    );
    return done === 1;
  }

  /** Frees the lock after a failure that must be retryable (5xx, unknown error). */
  async release(key: string, owner: string): Promise<boolean> {
    const released = await this.run(RELEASE, key, owner);
    return released === 1;
  }

  /** Heartbeat: the interceptor calls it every `lockTtl / 3` while the handler runs. */
  async extend(key: string, owner: string, lockTtl: number): Promise<boolean> {
    const extended = await this.run(EXTEND, key, owner, toWholeMs(lockTtl));
    return extended === 1;
  }

  /** Runs a script on the record's key. node-redis wants every argument as a string. */
  private run(
    script: string,
    key: string,
    ...args: (string | number)[]
  ): Promise<unknown> {
    return this.redis.eval(script, {
      keys: [`${this.prefix}${key}`],
      arguments: args.map(String),
    });
  }
}

/**
 * PEXPIRE rejects fractions of a millisecond, and Redis does not roll back a
 * script's earlier writes when a later command fails: a rejected PEXPIRE
 * after HSET would leave a lock that never expires. The interceptor already
 * passes whole milliseconds; this makes the store safe on its own.
 */
function toWholeMs(ms: number): number {
  const whole = Math.ceil(ms);
  if (!Number.isFinite(whole) || whole < 1) {
    throw new RangeError(
      `Expected a positive duration in milliseconds, got ${ms}`,
    );
  }
  return whole;
}
