import { LineItems, type OutboxRepository, type TransactionManager } from '@feature/common';
import { type OrderApi } from '@feature/order-api';
import {
  OrderFulfillmentCanceledEventPayload,
  OrderFulfillmentCanceledEventType,
  OrderFulfillmentDoneEventPayload,
  OrderFulfillmentDoneEventType,
} from '@feature/order-fulfillment-api';
import { Injectable } from '@nestjs/common';
import { type FulfillmentRepository } from './fulfillment.repository';

/**
 * [NOTE] for checking out reserve items have to use getReservedItems from order service
 */
@Injectable()
export class ProcessingService {
  constructor(
    private readonly repository: FulfillmentRepository,
    private readonly order: OrderApi,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {}

  list() {
    return this.repository.list();
  }

  async markAsProcessed({
    orderId,
    pickedStocks,
  }: {
    orderId: string;
    pickedStocks: LineItems<{ goodId: string; quantity: number }>;
  }) {
    const { items } = await this.order.getReservedItems({ orderId });

    if (!items.equals(pickedStocks, (a, b) => a.quantity === b.quantity)) {
      throw new Error('Processed stocks do not match required stocks');
    }

    await this.tx.run(async () => {
      await this.repository.dequeue(orderId, {
        status: 'processed',
        fulfilledAt: new Date(),
        items,
      });

      await this.outbox.save({
        type: OrderFulfillmentDoneEventType,
        payload: {
          orderId,
        } satisfies OrderFulfillmentDoneEventPayload,
      });
    });
  }

  async cancel({ orderId, reason }: { orderId: string; reason: string }) {
    await this.tx.run(async () => {
      await this.repository.dequeue(orderId, {
        status: 'canceled_by_merchant',
        canceledAt: new Date(),
        reason,
      });

      await this.outbox.save({
        type: OrderFulfillmentCanceledEventType,
        payload: {
          orderId,
        } satisfies OrderFulfillmentCanceledEventPayload,
      });
    });
  }
}
