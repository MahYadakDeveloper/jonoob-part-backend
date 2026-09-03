import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import { PaymentFailedEventPayload, PaymentFailedEventType } from '@feature/order-payment-api';
import {
  TicketVerificationFailedEventPayload,
  TicketVerificationFailedEventType,
} from '@feature/order-payment-gateway-api';
import { Injectable } from '@nestjs/common';
import { PaymentGatewayResolver } from '../payment-gateway.resolver';
import { type PaymentSessionRepository } from '../payment-session.repository';

@Injectable()
export class TicketVerificationFailedEventHandler extends BaseEventHandler<TicketVerificationFailedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: PaymentSessionRepository,
    private readonly gateways: PaymentGatewayResolver,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {
    super(registry, TicketVerificationFailedEventType);
  }

  async handle(payload: TicketVerificationFailedEventPayload) {
    if (payload.status === 'pending') return;
    const session = await this.repository.findById(payload.providerId);
    if (session?.status !== 'pending') throw new Error();
    if (session.method === 'wallet') throw new Error();

    await this.tx.run(async () => {
      switch (payload.status) {
        case 'expired':
          await this.repository.updatePaymentStatusTo<'expired'>({
            ...session,
            status: 'expired',
          });
          break;
        default:
          await this.repository.updatePaymentStatusTo<'failure'>({
            ...session,
            status: 'failure',
          });
      }

      await this.outbox.save({
        type: PaymentFailedEventType,
        payload: {
          orderId: session.orderId,
        } satisfies PaymentFailedEventPayload,
      });
    });
  }
}
