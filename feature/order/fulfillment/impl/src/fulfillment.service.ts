import { type CatalogApi, FindManyProductResponse } from '@feature/catalog-api';
import { LineItems, type OutboxRepository, type TransactionManager } from '@feature/common';
import { type OrderApi } from '@feature/order-api';
import {
  FulfillmentApi,
  FulfillmentCanceledByMerchantEventPayload,
  FulfillmentCanceledByMerchantEventType,
  FulfillmentDoneEventPayload,
  FulfillmentDoneEventType,
} from '@feature/order-fulfillment-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { type FulfillmentRepository } from './fulfillment.repository';

/**
 * [NOTE] for checking out reserve items have to use getReservedItems from order service
 */
@Injectable()
export class FulfillmentService implements FulfillmentApi {
  constructor(
    private readonly repository: FulfillmentRepository,
    private readonly order: OrderApi,
    private readonly catalog: CatalogApi,
    private readonly warehouse: WarehouseApi,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {}

  async initialize({
    orderId,
    items,
  }: {
    orderId: string;
    items: LineItems<{ productId: string; quantity: number }>;
  }): Promise<void> {
    const { products } = await this.catalog.findMany({ productIds: [...items.keys()] });
    const reserve = this.calculateReserveStock(items, products);
    await this.tx.run(async () => {
      // Reserve stocks
      await this.warehouse.reserveStock({ referenceId: orderId, items: reserve });

      await this.repository.create(orderId, reserve);
    });
  }

  async fulfill(req: { orderId: string }): Promise<void> {
    await this.repository.enqueue(req.orderId);
  }

  list() {
    return this.repository.list();
  }

  async markAsFulfilled({
    orderId,
    pickedStocks,
  }: {
    orderId: string;
    pickedStocks: LineItems<{ goodId: string; quantity: number }>;
  }) {
    const fulfill = await this.repository.find(orderId);
    if (!fulfill) throw new Error();

    if (!fulfill.items.equals(pickedStocks, (a, b) => a.quantity === b.quantity)) {
      throw new Error('Processed stocks do not match required stocks');
    }

    await this.tx.run(async () => {
      await this.warehouse.releaseStock({ referenceId: orderId, items: pickedStocks });
      await this.warehouse.issueGoods({
        reference: { source: 'order', id: orderId },
        items: pickedStocks,
      });

      await this.repository.dequeue(orderId, { status: 'fulfilled' });

      await this.outbox.save({
        type: FulfillmentDoneEventType,
        payload: {
          orderId,
        } satisfies FulfillmentDoneEventPayload,
      });
    });
  }

  async markAsCanceledByMerchant({ orderId, reason }: { orderId: string; reason: string }) {
    const fulfill = await this.repository.find(orderId);
    if (!fulfill) throw new Error();

    await this.tx.run(async () => {
      await this.repository.dequeue(orderId, {
        status: 'canceled_by_merchant',
        reason,
      });

      await this.warehouse.releaseStock({ referenceId: orderId, items: fulfill.items });

      await this.outbox.save({
        type: FulfillmentCanceledByMerchantEventType,
        payload: {
          orderId,
        } satisfies FulfillmentCanceledByMerchantEventPayload,
      });
    });
  }

  async cancel({ orderId }: { orderId: string; reason: string }) {
    const fulfill = await this.repository.find(orderId);
    if (!fulfill) throw new Error();

    switch (fulfill.status) {
      case 'initial':
      case 'processing':
      case 'fulfilled':
        await this.tx.run(async () => {
          await this.repository.dequeue(orderId, {
            status: 'canceled_by_customer',
          });

          await this.warehouse.releaseStock({ referenceId: orderId, items: fulfill.items });
        });
        break;
    }
  }

  private calculateReserveStock(
    items: LineItems<{ productId: string; quantity: number }>,
    products: FindManyProductResponse['products'],
  ): LineItems<{ goodId: string; quantity: number }> {
    const reserve = new LineItems<{ goodId: string; quantity: number }>((s) => s.goodId);
    for (const item of items) {
      const product = products.getOrThrow(item.productId);
      if (product.kind === 'leaf') {
        const alreadyAdded = reserve.get(item.productId);
        if (alreadyAdded)
          reserve.set({
            goodId: product.goodId,
            quantity: alreadyAdded.quantity + item.quantity,
          });
        else reserve.set({ goodId: product.goodId, quantity: item.quantity });
        continue;
      }

      for (const bundleItem of product.items) {
        const alreadyAdded = reserve.get(bundleItem.productId);
        if (alreadyAdded)
          reserve.set({
            goodId: bundleItem.goodId,
            quantity: alreadyAdded.quantity + bundleItem.quantity * item.quantity,
          });
        else
          reserve.set({
            goodId: bundleItem.goodId,
            quantity: bundleItem.quantity * item.quantity,
          });
      }
    }
    return reserve;
  }
}
