import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OtpGenerator,
  type OutboxRepository,
  type SettingsStore,
  type TransactionManager,
} from '@feature/common';
import { type CourierApi } from '@feature/courier-api';
import { type NotificationApi } from '@feature/notification-api';
import { type OrderApi, OrderEventPayload, OrderProcessedEventType } from '@feature/order-api';
import {
  CourierDispatchRequestedEventPayload,
  CourierDispatchRequestedEventType,
} from '@feature/order-delivery-api';
import { Injectable } from '@nestjs/common';
import { DeliverySettingsToken } from '../setting/token';

@Injectable()
export class OrderProcessedEventHandler extends BaseEventHandler<OrderEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly order: OrderApi,
    private readonly courier: CourierApi,
    private readonly settings: SettingsStore,
    private readonly notification: NotificationApi,
    private readonly otp: OtpGenerator,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, OrderProcessedEventType);
  }

  // {
  //   "id": 20,
  //   "name": "خوزستان",
  // }
  // {
  //    "id": 200,
  //    "name": "بندرماهشهر"
  // }
  // {
  //    "id": 684,
  //    "name": "بندرامام خمینی"
  // }
  // {
  //    "id": 1616,
  //    "name": "چمران"
  // }
  async handle({ orderId, occurredAt }: OrderEventPayload) {
    const { customer, delivery } = await this.order.getRecipientInformation({
      orderId,
    });

    await this.tx.run(async () => {
      // Make a request for shipping
      if (delivery.scope === 'intra-city') {
        await this.courier.pickup({
          orderId,
          scope: 'intra-city',
          recipient: {
            address: delivery.address,
            fullName: customer.fullName,
            phone: customer.phone,
            coordinate: delivery.coordinate,
          },
        });

        // Generate verification code
        const code = this.otp.generate(4);

        // Notify costumer the delivery in progress and have to give
        // confirmation code to courier
        await this.notification.notifyDeliveryInProgress({
          customerId: customer.id,
          code,
        });
      } else {
        const methods = await this.settings.get(DeliverySettingsToken);
        const method = methods.find((method) =>
          method.carrier !== 'courier'
            ? method.carrier.provider === delivery.carrier.provider
            : false,
        );

        if (!method) throw new Error();

        if (typeof method.carrier === 'object')
          await this.courier.pickup({
            orderId,
            scope: 'inter-city',
            carrier: {
              ...method.carrier,
            },
          });
        else throw new Error();
      }

      // Dispatch event
      await this.outbox.save({
        type: CourierDispatchRequestedEventType,
        payload: { orderId, occurredAt: new Date() } satisfies CourierDispatchRequestedEventPayload,
      });
    });
  }
}
