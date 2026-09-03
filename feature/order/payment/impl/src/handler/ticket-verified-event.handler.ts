import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import {
  PaymentSucceededEventPayload,
  PaymentSucceededEventType,
} from '@feature/order-payment-api';
import {
  TicketVerifiedEventPayload,
  TicketVerifiedEventType,
} from '@feature/order-payment-gateway-api';
import { Injectable } from '@nestjs/common';
import { type PaymentSessionRepository } from '../payment-session.repository';

@Injectable()
export class TicketVerifiedEventHandler extends BaseEventHandler<TicketVerifiedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: PaymentSessionRepository,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {
    super(registry, TicketVerifiedEventType);
  }

  async handle(payload: TicketVerifiedEventPayload) {
    const session = await this.repository.findById(payload.providerId);
    if (session?.status !== 'pending') throw new Error();
    if (session.method === 'wallet') throw new Error();

    await this.tx.run(async () => {
      await this.repository.updatePaymentStatusTo<'paid'>({
        ...session,
        status: 'paid',
        paidAt: new Date(),
      });

      await this.outbox.save({
        type: PaymentSucceededEventType,
        payload: {
          orderId: session.orderId,
        } satisfies PaymentSucceededEventPayload,
      });
    });
  }
}
