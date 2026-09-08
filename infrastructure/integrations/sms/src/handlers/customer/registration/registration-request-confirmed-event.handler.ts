import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
  RegistrationRequestConfirmedEventPayload,
  RegistrationRequestConfirmedEventType,
} from '@feature/customer-registration-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Handler extends BaseEventHandler<RegistrationRequestConfirmedEventPayload> {
  constructor(registry: EventHandlerRegistry) {
    super(registry, RegistrationRequestConfirmedEventType);
  }

  async handle(payload: RegistrationRequestConfirmedEventPayload) {
    // [TODO]
  }
}
