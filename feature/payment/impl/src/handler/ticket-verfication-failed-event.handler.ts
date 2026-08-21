import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
  TicketVerificationFailedEventPayload,
  TicketVerificationFailedEventType,
} from '@feature/payment-gateway-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TicketVerificationFailedEventHandler extends BaseEventHandler<TicketVerificationFailedEventPayload> {
  constructor(registry: EventHandlerRegistry) {
    super(registry, TicketVerificationFailedEventType);
  }

  async handle(payload: TicketVerificationFailedEventPayload) {
    // [TODO] update order state and fill payment field with rich information
    // [TODO] delete ticket (for delivery confirmation in the order payment ticket is preserved)
  }
}
