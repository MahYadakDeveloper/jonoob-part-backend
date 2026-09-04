import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import { PaymentFailedEventPayload, PaymentFailedEventType } from '@feature/order-payment-api';
import { Injectable } from '@nestjs/common';
import { type OrderRepository } from '../order.repository';

@Injectable()
export class PaymentFailedEventHandler extends BaseEventHandler<PaymentFailedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: OrderRepository,
  ) {
    super(registry, PaymentFailedEventType);
  }

  async handle(payload: PaymentFailedEventPayload) {
    await this.repository.markAs(payload.orderId, 'unsuccessful_pay');
  }
}
