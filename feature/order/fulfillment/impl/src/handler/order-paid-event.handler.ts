import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import { type OrderApi, OrderEventPayload, OrderPaidEventType } from '@feature/order-api';
import {
  OrderFulfillmentEnqueuedEventPayload,
  OrderFulfillmentEnqueuedEventType,
} from '@feature/order-fulfillment-api';
import { Injectable } from '@nestjs/common';
import { type FulfillmentRepository } from '../fulfillment.repository';

@Injectable()
export class OrderPaidEventHandler extends BaseEventHandler<OrderEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: FulfillmentRepository,
    private readonly order: OrderApi,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {
    super(registry, OrderPaidEventType);
  }

  async handle({ orderId }: OrderEventPayload) {
    await this.tx.run(async () => {
      await this.repository.enqueue(orderId, { status: 'processing' });
      await this.outbox.save({
        type: OrderFulfillmentEnqueuedEventType,
        payload: {
          orderId,
        } satisfies OrderFulfillmentEnqueuedEventPayload,
      });
    });
  }
}
