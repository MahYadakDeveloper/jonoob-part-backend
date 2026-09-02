import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
  DeliverySucceededEventPayload,
  DeliverySucceededEventType,
} from '@feature/order-delivery-courier-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeliverySucceededEventHandler extends BaseEventHandler<DeliverySucceededEventPayload> {
  constructor(registry: EventHandlerRegistry) {
    super(registry, DeliverySucceededEventType);
  }

  async handle(payload: DeliverySucceededEventPayload) {}
}
