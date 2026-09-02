import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import { OrderCanceledEventPayload, OrderCanceledEventType } from '@feature/order-api';
import { type CourierApi } from '@feature/order-delivery-courier-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderCanceledEventHandler extends BaseEventHandler<OrderCanceledEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly courier: CourierApi,
  ) {
    super(registry, OrderCanceledEventType);
  }

  async handle(payload: OrderCanceledEventPayload) {
    if (payload.inStatus !== 'courier-requested') return;

    await this.courier.cancelPickupRequest({ orderId: payload.orderId });
  }
}
