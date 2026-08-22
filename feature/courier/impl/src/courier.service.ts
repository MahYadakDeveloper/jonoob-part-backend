import { type OutboxRepository, type TransactionManager } from '@feature/common';
import {
  PackageDeliveredEventPayload,
  PackageDeliveredEventType,
  PackageHandedOverToCourierEventPayload,
  PackageHandedOverToCourierEventType,
  PickupRequest,
  type CourierApi,
} from '@feature/courier-api';
import { type OrderApi } from '@feature/order-api';
import { Injectable } from '@nestjs/common';
import { type CourierRepository } from './courier.repository';
import { ConfirmDeliveryRequest, PickingUpRequest } from './courier.req';

@Injectable()
export class CourierService implements CourierApi {
  constructor(
    private readonly courier: CourierRepository,
    private readonly order: OrderApi,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {}

  /**
   * role: system
   */
  pickup(req: PickupRequest): Promise<void> {
    // Notify all courier
    throw new Error('Method not implemented.');
  }

  getDeliveryAddress({ orderId }: { orderId: string }) {
    return this.order.getDeliveryAddress({ orderId });
  }

  /**
   * role: courier
   * [NOTE] have to get order id from specialist when picking up the package
   * @param req.courierId is from auth guard resolved
   * @param req.orderId is get form the who is playing the role
   */
  async pickedUp({ courierId, orderId }: PickingUpRequest): Promise<void> {
    await this.tx.run(async () => {
      await this.courier.addActiveDelivery(courierId, orderId);

      // Dispatch handed over event
      await this.outbox.save({
        type: PackageHandedOverToCourierEventType,
        payload: {
          courierId,
          orderId,
          occurredAt: new Date(),
        } satisfies PackageHandedOverToCourierEventPayload,
      });
    });
  }

  async confirmDelivery(req: ConfirmDeliveryRequest) {
    const { delivery } = await this.order.getDeliveryAddress({
      orderId: req.orderId,
    });

    if (req.scope === 'intra-city') {
      if (delivery.scope !== req.scope) throw new Error();

      const { code: deliveryConfirmationCode } =
        await this.order.getDeliveryConfirmationCodeOfHandedPackageOver({ orderId: req.orderId });
      if (deliveryConfirmationCode !== req.confirmationCode) throw new Error();

      await this.outbox.save({
        type: PackageDeliveredEventType,
        payload: {
          orderId: req.orderId,
          scope: 'intra-city',
          occurredAt: new Date(),
        } satisfies PackageDeliveredEventPayload,
      });

      return;
    }

    await this.outbox.save({
      type: PackageDeliveredEventType,
      payload: {
        orderId: req.orderId,
        scope: 'inter-city',
        trackingNumber: req.trackingCode,
        occurredAt: new Date(),
      } satisfies PackageDeliveredEventPayload,
    });
  }
}
