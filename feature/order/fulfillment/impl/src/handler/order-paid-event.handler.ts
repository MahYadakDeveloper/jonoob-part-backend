import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import { OrderEventPayload, OrderPaidEventType } from '@feature/order-api';
import {
  FulfillmentEnqueuedForProcessing,
  FulfillmentProcessingStartedEventPayload,
} from '@feature/order-fulfillment-api';
import { Injectable } from '@nestjs/common';
import { type FulfillmentRepository } from '../fulfillment.repository';

@Injectable()
export class OrderPaidEventHandler extends BaseEventHandler<OrderEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: FulfillmentRepository,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {
    super(registry, OrderPaidEventType);
  }

  async handle({ orderId }: OrderEventPayload) {
    await this.tx.run(async () => {
      await this.repository.enqueue(orderId);
      await this.outbox.save({
        type: FulfillmentEnqueuedForProcessing,
        payload: {} satisfies FulfillmentProcessingStartedEventPayload,
      });
    });
  }
}
