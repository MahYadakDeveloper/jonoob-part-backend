import {
  CacheInvalidationJobName,
  CacheInvalidationJobPayload,
  CacheInvalidationQueueName,
} from '@jonoob-part/contracts';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class CacheInvalidationQueue {
  constructor(
    @InjectQueue(CacheInvalidationQueueName)
    private readonly queue: Queue,
  ) {}

  async addJob(payload: CacheInvalidationJobPayload) {
    await this.queue.add(CacheInvalidationJobName, payload);
  }
}
