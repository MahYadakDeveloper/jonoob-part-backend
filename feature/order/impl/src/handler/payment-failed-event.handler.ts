import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import { PaymentFailedEventPayload, PaymentFailedEventType } from '@feature/order-payment-api';
import { Injectable } from '@nestjs/common';
import { type OrderRepository } from '../order.repository';

@Injectable()
export class PaymentFailedEventHandler extends BaseEventHandler<PaymentFailedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: OrderRepository,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, PaymentFailedEventType);
  }

  async handle(payload: PaymentFailedEventPayload) {
    const order = await this.repository.findBySessionId(payload.sessionId);

    await this.repository.markAs(order.id, 'payment_not_completed');
  }
}
