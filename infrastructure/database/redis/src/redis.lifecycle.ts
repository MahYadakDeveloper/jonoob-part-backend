import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import { type RedisClientType } from 'redis';

@Injectable()
export class RedisLifecycle implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly client: RedisClientType,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
