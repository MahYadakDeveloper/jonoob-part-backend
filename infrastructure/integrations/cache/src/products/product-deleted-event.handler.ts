import { ProductDeletedEventPayload, ProductDeletedEventType } from '@feature/catalog-api';
import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import { Injectable } from '@nestjs/common';
import { CacheInvalidationQueue } from '../cache-invalidation.queue';

@Injectable()
export class ProductDeletedEventHandler extends BaseEventHandler<ProductDeletedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly queue: CacheInvalidationQueue,
  ) {
    super(registry, ProductDeletedEventType);
  }

  async handle(payload: ProductDeletedEventPayload): Promise<void> {
    await this.queue.addJob({
      tag: 'product',
      scope: 'one',
      cacheId: payload.productId,
    });
  }
}
