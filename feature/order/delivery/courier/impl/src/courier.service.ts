import { type OtpGenerator, type OutboxRepository, type TransactionManager } from '@feature/common';
import { type NotificationApi } from '@feature/notification-api';
import { type OrderApi } from '@feature/order-api';
import { type DeliveryApi } from '@feature/order-delivery-api';
import {
  CancelPickupRequest,
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
    private readonly order: OrderApi,
    private readonly delivery: DeliveryApi,
    private readonly notification: NotificationApi,
    private readonly otp: OtpGenerator,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {}

  cancelPickupRequest({ orderId }: CancelPickupRequest): Promise<void> {}

  /**
   * role: system
   */
  pickup(req: PickupRequest): Promise<void> {
    // Notify all courier
    throw new Error('Method not implemented.');
  }

  /**
   * role: courier
   * [NOTE] have to get order id from specialist when picking up the package
   * @param req.courierId is from auth guard resolved
   * @param req.orderId is get form the who is playing the role
   */
  async pickedUp({ courierId, orderId }: PickingUpRequest): Promise<void> {
    const { delivery } = await this.delivery.findDelivery({ orderId });
    await this.tx.run(async () => {
      // Make a request for shipping
      if (delivery.scope === 'intra-city') {
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
            scope: 'intra-city',
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
            scope: 'inter-city',
          } satisfies PackageHandedOverToCourierEventPayload,
        });
      }

      await this.courier.addDelivery(courierId, delivery.id);
    });
  }

  async reportDeliveryAttempt(req: ReportDeliveryAttemptRequest) {
    const delivery = await this.courier.getDelivery(req.courierId, req.deliveryId);
    if (delivery.status !== 'handed-over-to-courier') throw new Error();

    if (req.result === 'delivered') {
      if (delivery.scope === 'intra-city') {
        if (req.scope !== delivery.scope) throw new Error();

        if (delivery.deliveryConfirmationCode !== req.confirmationCode) throw new Error();

        await this.outbox.save({
          type: DeliverySucceededEventType,
          payload: {
            deliveryId: req.deliveryId,
            scope: 'intra-city',
          } satisfies DeliverySucceededEventPayload,
        });
        return;
      }

      if (req.scope !== delivery.scope) throw new Error();
      await this.outbox.save({
        type: DeliverySucceededEventType,
        payload: {
          deliveryId: req.deliveryId,
          scope: 'inter-city',
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
