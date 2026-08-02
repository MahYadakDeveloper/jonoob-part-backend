import { ProductDeletedEventPayload, ProductDeletedEventType } from '@feature/catalog-api';
import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import { CacheInvalidationQueue } from '@jonoob-part/contracts';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ProductDeletedEventHandler extends BaseEventHandler<ProductDeletedEventPayload> {
  constructor(
    @InjectQueue(CacheInvalidationQueue) private readonly queue: Queue,
    registry: EventHandlerRegistry,
  ) {
    super(registry, ProductDeletedEventType);
  }

  async handle(payload: ProductDeletedEventPayload): Promise<void> {
    await this.queue.add(
      ProductDeletedEventType,
      {
        productId: payload.productId,
      } satisfies ProductDeletedEventPayload,
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
