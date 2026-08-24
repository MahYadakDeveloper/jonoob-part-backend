import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import { OrderEventPayload, OrderPaidEventType } from '@feature/order-api';
import { Injectable } from '@nestjs/common';
import { type ProcessingOrderRepository } from '../process.repository';

@Injectable()
export class OrderPaidEventHandler extends BaseEventHandler<OrderEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: ProcessingOrderRepository,
  ) {
    super(registry, OrderPaidEventType);
  }

  async handle({ orderId }: OrderEventPayload) {
    await this.repository.enqueue(orderId);
  }
}
