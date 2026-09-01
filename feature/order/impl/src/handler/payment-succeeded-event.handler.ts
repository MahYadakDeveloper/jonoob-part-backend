import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import { OrderPaidEventPayload, OrderPaidEventType } from '@feature/order-api';
import {
  PaymentSucceededEventPayload,
  PaymentSucceededEventType,
} from '@feature/order-payment-api';
import { Injectable } from '@nestjs/common';
import { type OrderRepository } from '../order.repository';

@Injectable()
export class PaymentSucceededEventHandler extends BaseEventHandler<PaymentSucceededEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: OrderRepository,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, PaymentSucceededEventType);
  }

  async handle(payload: PaymentSucceededEventPayload) {
    const order = await this.repository.findBySessionId(payload.sessionId);

    await this.outbox.save({
      type: OrderPaidEventType,
      payload: {
        orderId: order.id,
      } satisfies OrderPaidEventPayload,
    });
  }
}
