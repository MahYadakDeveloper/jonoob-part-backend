import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
    DeliveryFailedEventPayload,
    DeliveryFailedEventType,
} from '@feature/order-delivery-courier-api';
import { Injectable } from '@nestjs/common';
import { type DeliveryRepository } from '../delivery.repository';

@Injectable()
export class DeliveryFailedEventHandler extends BaseEventHandler<DeliveryFailedEventPayload> {
  constructor(registry: EventHandlerRegistry,
    readonly repository: DeliveryRepository
  ) {
    super(registry, DeliveryFailedEventType);
  }

  async handle(payload: DeliveryFailedEventPayload) {
    await this.repository.
  }
}
