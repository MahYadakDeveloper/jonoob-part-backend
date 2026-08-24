import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import { type CourierApi } from '@feature/courier-api';
import { OrderCanceledEventType, OrderEventPayload } from '@feature/order-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderCanceledEventHandler extends BaseEventHandler<OrderEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly courier: CourierApi,
  ) {
    super(registry, OrderCanceledEventType);
  }

  async handle(payload: OrderEventPayload) {
    await this.courier.cancelPickupRequest({ orderId: payload.orderId });
  }
}
