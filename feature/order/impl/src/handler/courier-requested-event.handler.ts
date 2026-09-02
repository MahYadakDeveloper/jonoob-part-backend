import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
  CourierDispatchRequestedEventPayload,
  CourierDispatchRequestedEventType,
} from '@feature/order-delivery-api';
import { Injectable } from '@nestjs/common';
import { type OrderRepository } from '../order.repository';

@Injectable()
export class CourierRequestEventHandler extends BaseEventHandler<CourierDispatchRequestedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: OrderRepository,
  ) {
    super(registry, CourierDispatchRequestedEventType);
  }

  async handle(payload: CourierDispatchRequestedEventPayload) {
    await this.repository.markAs(payload.orderId, 'courier_requested');
  }
}
