import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import {
  OrderHandedOverToCourierEventPayload,
  OrderHandedOverToCourierEventType,
} from '@feature/order-delivery-api';
import {
  PackageHandedOverToCourierEventPayload,
  PackageHandedOverToCourierEventType,
} from '@feature/order-delivery-courier-api';
import { Injectable } from '@nestjs/common';
import { type DeliveryRepository } from '../delivery.repository';

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
        courierId: payload.courierId,
        deliveryConfirmationCode: payload.deliveryConfirmationCode,
        handedOverAt: new Date(),
      });
    else
      await this.repository.markAsHandedOverToCourier(payload.deliveryId, {
        courierId: payload.courierId,
        handedOverAt: new Date(),
      });

    const { orderId } = await this.repository.getOrderId(payload.deliveryId);

    await this.outbox.save({
      type: OrderHandedOverToCourierEventType,
      payload: {
        orderId,
      } satisfies OrderHandedOverToCourierEventPayload,
    });
  }
}
