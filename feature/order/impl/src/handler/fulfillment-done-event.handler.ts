import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
} from '@feature/common';
import { OrderEventPayload, OrderFulfilledEventType } from '@feature/order-api';
import {
  OrderFulfillmentDoneEventPayload,
  OrderFulfillmentDoneEventType,
} from '@feature/order-fulfillment-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderFulfillmentDoneHandler extends BaseEventHandler<OrderFulfillmentDoneEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, OrderFulfillmentDoneEventType);
  }

  async handle(payload: OrderFulfillmentDoneEventPayload) {
    await this.outbox.save({
      type: OrderFulfilledEventType,
      payload: {
        orderId: payload.orderId,
      } satisfies OrderEventPayload,
    });
  }
}
