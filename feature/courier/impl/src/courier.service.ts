import { type OutboxRepository } from '@feature/common';
import {
  PackageDeliveredEventPayload,
  PackageDeliveredEventType,
  PickupRequest,
  type CourierApi,
} from '@feature/courier-api';
import { type OrderApi } from '@feature/order-api';
import { Injectable } from '@nestjs/common';
import { ConfirmDeliveryRequest } from './courier.req';

@Injectable()
export class CourierService implements CourierApi {
  constructor(
    private readonly order: OrderApi,
    private readonly outbox: OutboxRepository,
  ) {}

  pickup(req: PickupRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }

  pickedUp() {
    // Dispatch handed over event
  }

  async confirmDelivery(req: ConfirmDeliveryRequest) {
    const { order } = await this.order.findById({ orderId: req.orderId });

    if (req.scope === 'intra-city') {
      if (order.recipient.scope !== req.scope) throw new Error();

      if (order.status !== 'in-delivery') throw new Error();

      if (order.deliveryConfirmationCode !== req.confirmationCode) throw new Error();

      await this.outbox.save({
        type: PackageDeliveredEventType,
        payload: {
          orderId: order.orderId,
          scope: 'intra-city',
          occurredAt: new Date(),
        } satisfies PackageDeliveredEventPayload,
      });

      return;
    }

    await this.outbox.save({
      type: PackageDeliveredEventType,
      payload: {
        orderId: order.orderId,
        scope: 'intra-city',
        occurredAt: new Date(),
      } satisfies PackageDeliveredEventPayload,
    });
  }
}
