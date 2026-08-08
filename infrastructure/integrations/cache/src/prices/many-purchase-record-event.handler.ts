import { type CatalogApi } from '@feature/catalog-api';
import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
  ManyPurchaseRecordEventPayload,
  ManyPurchaseRecordEventType,
} from '@feature/procurement-supply-purchase-api';
import { Injectable } from '@nestjs/common';
import { CacheInvalidationQueue } from '../cache-invalidation.queue';

@Injectable()
export class ManyPurchaseRecordEventHandler extends BaseEventHandler<ManyPurchaseRecordEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly catalog: CatalogApi,
    private readonly queue: CacheInvalidationQueue,
  ) {
    super(registry, ManyPurchaseRecordEventType);
  }

  async handle(payload: ManyPurchaseRecordEventPayload): Promise<void> {
    const { products } = await this.catalog.findManyByGoodId({ goodIds: payload.goodIds });

    this.queue.addJob({
      tag: 'price',
      scope: 'many',
      cacheIds: [...products.indexedBy((p) => p.id).keys()],
    });
  }
}
