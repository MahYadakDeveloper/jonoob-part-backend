import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import { OrderPaymentFailedEventPayload, OrderPaymentFailedEventType } from '@feature/order-api';
import {
  TicketVerificationFailedEventPayload,
  TicketVerificationFailedEventType,
} from '@feature/payment-gateway-api';
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
    const gateway = this.gateways.resolve(payload.gateway);
    // [TODO] delete ticket (for delivery confirmation in the order payment ticket is preserved)
    await this.tx.run(async () => {
      // [TODO] delete ticket (for delivery confirmation in the order payment ticket is preserved)
      await gateway.removeTicket({ ticketId: payload.ticketId });

      await this.repository.updateGatewayStatus({
        name: gateway.name,
        status:
          payload.status === 'expired'
            ? 'expired'
            : payload.status === 'canceled'
              ? 'canceled'
              : 'failed',
      });

      await this.outbox.save({
        type: OrderPaymentFailedEventType,
        payload: {
          payment: {
            gateway: gateway.name,
            ticketId: payload.ticketId,
            occurredAt: new Date(),
            status:
              payload.status === 'canceled'
                ? 'canceled'
                : payload.status === 'expired'
                  ? 'expired'
                  : payload.status === 'reversed'
                    ? 'reversed'
                    : 'invalid',
          },
        } satisfies OrderPaymentFailedEventPayload,
      });
    });
  }
}
