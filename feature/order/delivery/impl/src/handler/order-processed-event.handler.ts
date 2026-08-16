// [TODO] use courier api to hand the package and after package handed then
// dispatch an event to be handled by order to update the status

import { BaseEventHandler, EventHandlerRegistry } from '@feature/common';
import { OrderEventPayload, OrderProcessedEventType } from '@feature/order-api';

export class OrderProcessedEventHandler extends BaseEventHandler<OrderEventPayload> {
  constructor(registry: EventHandlerRegistry) {
    super(registry, OrderProcessedEventType);
  }

  async handle(payload: OrderEventPayload) {}
}
