import { ProductRedefinedEventPayload, ProductRedefinedEventType } from '@feature/catalog-api';
import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
  CacheInvalidationQueue,
  ProductUpdatedEventJobName,
  ProductUpdatedEventJobPayload,
} from '@jonoob-part/contracts';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ProductRedefinedEventHandler extends BaseEventHandler<ProductRedefinedEventPayload> {
  constructor(
    @InjectQueue(CacheInvalidationQueue) private readonly queue: Queue,
    registry: EventHandlerRegistry,
  ) {
    super(registry, ProductRedefinedEventType);
  }

  async handle(payload: ProductRedefinedEventPayload): Promise<void> {
    await this.queue.add(
      ProductUpdatedEventJobName,
      {
        productId: payload.productId,
      } satisfies ProductUpdatedEventJobPayload,
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
  }
}
