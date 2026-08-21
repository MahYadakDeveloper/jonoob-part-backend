import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import { TicketVerifiedEventPayload, TicketVerifiedEventType } from '@feature/payment-gateway-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TicketVerifiedEventHandler extends BaseEventHandler<TicketVerifiedEventPayload> {
  constructor(registry: EventHandlerRegistry) {
    super(registry, TicketVerifiedEventType);
  }

  async handle(payload: TicketVerifiedEventPayload) {
    // [TODO] update order state and fill payment field with rich information
    // [TODO] delete ticket (for delivery confirmation in the order payment ticket is preserved)
  }
}
