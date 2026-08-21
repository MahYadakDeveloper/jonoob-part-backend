import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import { OrderPaidEventPayload, OrderPaidEventType } from '@feature/order-api';
import { TicketVerifiedEventPayload, TicketVerifiedEventType } from '@feature/payment-gateway-api';
import { Injectable } from '@nestjs/common';
import { PaymentGatewayResolver } from '../payment-gateway.resolver';
import { type PaymentSessionRepository } from '../payment-session.repository';

@Injectable()
export class TicketVerifiedEventHandler extends BaseEventHandler<TicketVerifiedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: PaymentSessionRepository,
    private readonly gateways: PaymentGatewayResolver,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {
    super(registry, TicketVerifiedEventType);
  }

  async handle(payload: TicketVerifiedEventPayload) {
    const gateway = this.gateways.resolve(payload.gateway);

    await this.tx.run(async () => {
      // [TODO] delete ticket (for delivery confirmation in the order payment ticket is preserved)
      await gateway.removeTicket({ ticketId: payload.ticketId });

      // [TODO] delete the payment session too
      await this.repository.delete(payload.providerId);

      await this.outbox.save({
        type: OrderPaidEventType,
        payload: {
          payment: {
            ticketId: payload.ticketId,
            gateway: gateway.name,
            providerId: payload.providerId,
            settledAt: new Date(),
          },
        } satisfies OrderPaidEventPayload,
      });
    });
  }
}
