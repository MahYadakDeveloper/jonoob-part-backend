import {
  FitmentNodeDeletedEventType,
  FitmentNodeDeletedPayload,
} from '@feature/catalog.fitment.node-api';
import { BaseEventHandler, EventHandlerRegistry } from '@feature/common';

export class FitmentNodeDeletedEventHandler extends BaseEventHandler<FitmentNodeDeletedPayload> {
  constructor(registry: EventHandlerRegistry) {
    super(registry, FitmentNodeDeletedEventType);
  }

  handle(payload: FitmentNodeDeletedPayload): Promise<void> {
    // [TODO] Delete logo's/images related to make/model nodes.
    throw new Error('Method not implemented.');
  }
}
