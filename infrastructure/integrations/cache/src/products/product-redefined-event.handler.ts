import { ProductRedefinedEventPayload, ProductRedefinedEventType } from '@feature/catalog-api';
import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';

import { Injectable } from '@nestjs/common';
import { CacheInvalidationQueue } from '../cache-invalidation.queue';

@Injectable()
export class ProductRedefinedEventHandler extends BaseEventHandler<ProductRedefinedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly queue: CacheInvalidationQueue,
  ) {
    super(registry, ProductRedefinedEventType);
  }

  async handle(payload: ProductRedefinedEventPayload): Promise<void> {
    await this.queue.addJob({
      tag: 'product',
      scope: 'one',
      cacheId: payload.productId,
    });
  }
}
