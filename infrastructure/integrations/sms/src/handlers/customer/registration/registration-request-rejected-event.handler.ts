import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
  RegistrationRequestRejectedEventPayload,
  RegistrationRequestRejectedEventType,
} from '@feature/customer-registration-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Handler extends BaseEventHandler<RegistrationRequestRejectedEventPayload> {
  constructor(registry: EventHandlerRegistry) {
    super(registry, RegistrationRequestRejectedEventType);
  }

  async handle(payload: RegistrationRequestRejectedEventPayload) {
    // [TODO]
  }
}
