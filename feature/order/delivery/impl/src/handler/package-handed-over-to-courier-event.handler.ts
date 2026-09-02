import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import {
  PackageHandedOverToCourierEventPayload,
  PackageHandedOverToCourierEventType,
} from '@feature/order-delivery-api';
import { Injectable } from '@nestjs/common';
import { type DeliveryRepository } from '../delivery.repository';
import { OrderEventPayload, OrderHandedToCourierEventType } from '@feature/order-api';

@Injectable()
export class PackageHandedOverToCourierEventHandler extends BaseEventHandler<PackageHandedOverToCourierEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: DeliveryRepository,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, PackageHandedOverToCourierEventType);
  }

  async handle(payload: PackageHandedOverToCourierEventPayload) {
    if (payload.scope === 'intra-city')
      await this.repository.markAsHandedOverToCourier(payload.deliveryId, {
        deliveryConfirmationCode: payload.deliveryConfirmationCode,
        handedOverAt: new Date(),
      });
    else
      await this.repository.markAsHandedOverToCourier(payload.deliveryId, {
        handedOverAt: new Date(),
      });

    await this.outbox.save({
      type: OrderHandedToCourierEventType,
      payload: {} satisfies OrderEventPayload,
    });
  }
}
