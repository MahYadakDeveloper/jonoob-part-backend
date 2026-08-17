// [TODO] use courier api to hand the package and after package handed then
// dispatch an event to be handled by order to update the status

import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OutboxRepository,
  type SettingsStore,
  type TransactionManager,
} from '@feature/common';
import { type CourierApi } from '@feature/courier-api';
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
  async handle(payload: OrderEventPayload) {
    const {
      order: { orderId, customer, recipient },
    } = await this.order.findById({ orderId: payload.orderId });

    await this.tx.run(async () => {
      // Make a request for shipping
      if (recipient.scope === 'intra-city')
        await this.courier.pickup({
          orderId,
          scope: 'intra-city',
          recipient: {
            address: recipient.address,
            fullName: customer.fullName,
            phone: customer.phone,
            coordinate: recipient.coordinate,
          },
        });
      else {
        const methods = await this.settings.get(DeliverySettingsToken);
        const method = methods.find((method) =>
          method.carrier !== 'courier'
            ? method.carrier.provider === recipient.carrier.provider
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
        else {
          throw new Error();
        }
      }

      // Dispatch event
      await this.outbox.save({
        type: CourierDispatchRequestedEventType,
        payload: { orderId, occurredAt: new Date() } satisfies CourierDispatchRequestedEventPayload,
      });
    });
  }
}
