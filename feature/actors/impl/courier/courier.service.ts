import { type OtpGenerator, type OutboxRepository, type TransactionManager } from '@feature/common';
import { type NotificationApi } from '@feature/notification-api';
import { type DeliveryApi } from '@feature/order-delivery-api';
import {
  DeliveryFailedEventPayload,
  DeliveryFailedEventType,
  DeliverySucceededEventPayload,
  DeliverySucceededEventType,
  PackageHandedOverToCourierEventPayload,
  PackageHandedOverToCourierEventType,
  PickupRequest,
  type CourierApi,
} from '@feature/order-delivery-courier-api';
import { Injectable } from '@nestjs/common';
import { type CourierRepository } from './courier.repository';
import { PickingUpRequest, ReportDeliveryAttemptRequest } from './courier.req';

@Injectable()
export class CourierService implements CourierApi {
  constructor(
    private readonly courier: CourierRepository,
    private readonly delivery: DeliveryApi,
    private readonly notification: NotificationApi,
    private readonly otp: OtpGenerator,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {}

  /**
   * role: system
   */
  async pickup(req: PickupRequest): Promise<void> {
    await this.notification.notifyCouriersOfPickupRequested();
  }

  /**
   * role: courier
   * [NOTE] have to get order id from specialist when picking up the package
   * @param req.courierId is from auth guard resolved
   * @param req.orderId is get form the who is playing the role
   */
  async pickedUp({ courierId, deliveryId }: PickingUpRequest): Promise<void> {
    const { delivery } = await this.delivery.findOne({ deliveryId });

    if (delivery.status !== 'courier_requested') throw new Error();

    await this.tx.run(async () => {
      // Make a request for shipping
      if (delivery.recipient.scope === 'intra_city') {
        // Generate verification code
        const code = this.otp.generate(4);

        // Notify costumer the delivery in progress and have to give
        // confirmation code to courier
        await this.notification.notifyCustomerPackageIsOnItsWay({
          customerId: delivery.recipient.customer.id,
          code,
        });

        // Dispatch handed over event
        await this.outbox.save({
          type: PackageHandedOverToCourierEventType,
          payload: {
            courierId,
            deliveryId: delivery.id,
            scope: 'intra_city',
            deliveryConfirmationCode: code,
          } satisfies PackageHandedOverToCourierEventPayload,
        });
      } else {
        // Dispatch handed over event
        await this.outbox.save({
          type: PackageHandedOverToCourierEventType,
          payload: {
            courierId,
            deliveryId: delivery.id,
            scope: 'inter_city',
          } satisfies PackageHandedOverToCourierEventPayload,
        });
      }

      await this.courier.addDelivery(courierId, delivery.id);
    });
  }

  async reportDeliveryAttempt(req: ReportDeliveryAttemptRequest) {
    const delivery = await this.courier.getDelivery(req.courierId, req.deliveryId);
    if (delivery.status !== 'handed_over_to_courier') throw new Error();

    if (req.result === 'delivered') {
      if (delivery.recipient.scope === 'intra_city') {
        if (req.scope !== delivery.recipient.scope) throw new Error();

        if (delivery.recipient.deliveryConfirmationCode !== req.confirmationCode) throw new Error();

        await this.outbox.save({
          type: DeliverySucceededEventType,
          payload: {
            deliveryId: req.deliveryId,
            scope: 'intra_city',
          } satisfies DeliverySucceededEventPayload,
        });
        return;
      }

      if (req.scope !== delivery.recipient.scope) throw new Error();
      await this.outbox.save({
        type: DeliverySucceededEventType,
        payload: {
          deliveryId: req.deliveryId,
          scope: 'inter_city',
          trackingNumber: req.trackingNumber,
        } satisfies DeliverySucceededEventPayload,
      });

      return;
    }

    await this.outbox.save({
      type: DeliveryFailedEventType,
      payload: {
        ...req,
      } satisfies DeliveryFailedEventPayload,
    });
  }
}
