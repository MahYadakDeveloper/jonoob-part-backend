import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import { PackageDeliveredEventPayload, PackageDeliveredEventType } from '@feature/courier-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PackageDeliveredEventHandler extends BaseEventHandler<PackageDeliveredEventPayload> {
  constructor(registry: EventHandlerRegistry) {
    super(registry, PackageDeliveredEventType);
  }

  async handle(payload: PackageDeliveredEventPayload) {
    const 
  }
}
