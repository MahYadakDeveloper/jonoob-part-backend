import type { CatalogApi, FindManyProductResponse } from '@feature/catalog-api';
import {
  LineItems,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import {
  FulfillmentApi,
  FulfillmentCanceledByMerchantEventPayload,
  FulfillmentCanceledByMerchantEventType,
  FulfillmentDoneEventPayload,
  FulfillmentDoneEventType,
} from '@feature/order-fulfillment-api';
import type { WarehouseApi } from '@feature/warehouse-api';
import type { StockReserverApi } from '@feature/warehouse-reserve-api';
import { Injectable } from '@nestjs/common';
import type { FulfillmentRepository } from './fulfillment.repository';

/**
 * [NOTE] for checking out reserve items have to use getReservedItems from order service
 */
@Injectable()
export class FulfillmentService implements FulfillmentApi {
  constructor(
    private readonly repository: FulfillmentRepository,
    private readonly catalog: CatalogApi,
    private readonly warehouse: WarehouseApi,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
    private readonly reserver: StockReserverApi,
  ) {}

  async create({
    orderId,
    items,
  }: {
    orderId: string;
    items: LineItems<{ productId: string; quantity: number }>;
  }): Promise<void> {
    const { products } = await this.catalog.findMany({
      productIds: [...items.keys()],
    });
    const reserve = this.calculateReserveStock(items, products);
    await this.tx.run(async () => {
      // Reserve stocks
      await this.reserver.reserve({
        referenceId: orderId,
        items: reserve,
      });

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
    pickedStocks: LineItems<{ stockId: string; qty: number }>;
  }) {
    const fulfill = await this.repository.find(orderId);
    if (!fulfill) throw new Error();

    if (!fulfill.items.equals(pickedStocks, (a, b) => a.qty === b.qty)) {
      throw new Error('Processed stocks do not match required stocks');
    }

    await this.tx.run(async () => {
      await this.reserver.release({
        referenceId: orderId,
        items: pickedStocks,
      });

      await this.warehouse.issue({
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

  async markAsCanceledByMerchant({
    orderId,
    reason,
  }: {
    orderId: string;
    reason: string;
  }) {
    const fulfill = await this.repository.find(orderId);
    if (!fulfill) throw new Error();

    await this.tx.run(async () => {
      await this.repository.dequeue(orderId, {
        status: 'canceled_by_merchant',
        reason,
      });

      await this.reserver.release({
        referenceId: orderId,
        items: fulfill.items,
      });

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

          await this.reserver.release({
            referenceId: orderId,
            items: fulfill.items,
          });
        });
        break;
    }
  }

  private calculateReserveStock(
    items: LineItems<{ productId: string; quantity: number }>,
    products: FindManyProductResponse['products'],
  ): LineItems<{ stockId: string; qty: number }> {
    const reserve = new LineItems<{ stockId: string; qty: number }>(
      (s) => s.stockId,
    );
    for (const item of items) {
      const product = products.getOrThrow(item.productId);
      if (product.kind === 'leaf') {
        const alreadyAdded = reserve.get(item.productId);
        if (alreadyAdded)
          reserve.set({
            stockId: product.goodId,
            qty: alreadyAdded.qty + item.quantity,
          });
        else reserve.set({ stockId: product.goodId, qty: item.quantity });
        continue;
      }

      for (const bundleItem of product.items) {
        const alreadyAdded = reserve.get(bundleItem.productId);
        if (alreadyAdded)
          reserve.set({
            stockId: bundleItem.goodId,
            qty: alreadyAdded.qty + bundleItem.quantity * item.quantity,
          });
        else
          reserve.set({
            stockId: bundleItem.goodId,
            qty: bundleItem.quantity * item.quantity,
          });
      }
    }
    return reserve;
  }
}
