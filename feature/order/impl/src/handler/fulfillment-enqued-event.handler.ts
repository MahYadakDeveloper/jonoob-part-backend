import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
  OrderFulfillmentEnqueuedEventPayload,
  OrderFulfillmentEnqueuedEventType,
} from '@feature/order-fulfillment-api';
import { Injectable } from '@nestjs/common';
import { type OrderRepository } from '../order.repository';

@Injectable()
export class OrderFulfillmentEnqueuedEventHandler extends BaseEventHandler<OrderFulfillmentEnqueuedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: OrderRepository,
  ) {
    super(registry, OrderFulfillmentEnqueuedEventType);
  }

  async handle(payload: OrderFulfillmentEnqueuedEventPayload) {
    await this.repository.markAs(payload.orderId, 'process');
  }
}
