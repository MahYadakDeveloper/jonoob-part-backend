import { type RedisClientType } from "redis";
import { ICache } from "./warehouse.cache";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RedisCache implements ICache {
  constructor(private readonly client: RedisClientType) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.client.get(key);

    if (!value) return undefined;

    // return JSON.parse(value) as T;
  }

  async set<T>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void> {
    // const data = JSON.stringify(value);

    if (options?.ttl) {
      await this.client.set(key, data, {
        EX: options.ttl,
      });
    } else {
      await this.client.set(key, data);
    }
  }

  async invalidate(key: string): Promise<void> {
    await this.client.del(key);
  }

  async invalidateMany(keys: string[]): Promise<void> {
    if (!keys.length) return;

    await this.client.del(keys);
  }
}
