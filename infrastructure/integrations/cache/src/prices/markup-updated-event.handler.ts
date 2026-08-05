import { type CatalogApi } from '@feature/catalog-api';
import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
  MarkupPolicyDeletedEventType,
  MarkupPolicyEventPayload,
  MarkupPolicyUpdatedEventType,
} from '@feature/pricing-markup-api';
import { Injectable } from '@nestjs/common';
import { CacheInvalidationQueue } from '../cache-invalidation.queue';

@Injectable()
export class MarkupPolicyUpdatedEventHandler extends BaseEventHandler<MarkupPolicyEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly catalog: CatalogApi,
    private readonly queue: CacheInvalidationQueue,
  ) {
    super(registry, MarkupPolicyUpdatedEventType);
  }

  async handle(payload: MarkupPolicyEventPayload): Promise<void> {
    switch (payload.scope) {
      case 'product':
        await this.queue.addJob({ tag: 'price', scope: 'one', cacheId: payload.referenceId });
        break;
      case 'brand': {
        const { products } = await this.catalog.findByBrand({ brandId: payload.referenceId });
        await this.queue.addJob({ tag: 'price', scope: 'many', cacheIds: [...products.keys()] });
        break;
      }
      case 'category': {
        const { products } = await this.catalog.findByCategory({ categoryId: payload.referenceId });
        await this.queue.addJob({ tag: 'price', scope: 'many', cacheIds: [...products.keys()] });
        break;
      }
      case 'global': {
        await this.queue.addJob({ tag: 'price', scope: 'all' });
        break;
      }
    }
  }
}
