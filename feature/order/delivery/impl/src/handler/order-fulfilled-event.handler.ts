import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type OtpGenerator,
  type OutboxRepository,
  type SettingsStore,
  type TransactionManager,
} from '@feature/common';
import { type NotificationApi } from '@feature/notification-api';
import { OrderEventPayload, OrderFulfilledEventType } from '@feature/order-api';
import {
  CourierDispatchRequestedEventPayload,
  CourierDispatchRequestedEventType,
} from '@feature/order-delivery-api';
import { type CourierApi } from '@feature/order-delivery-courier-api';
import { Injectable } from '@nestjs/common';
import { type DeliveryRepository } from '../delivery.repository';

@Injectable()
export class OrderFulfilledEventHandler extends BaseEventHandler<OrderEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: DeliveryRepository,
    private readonly courier: CourierApi,
    private readonly settings: SettingsStore,
    private readonly notification: NotificationApi,
    private readonly otp: OtpGenerator,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {
    super(registry, OrderFulfilledEventType);
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
  async handle({ orderId }: OrderEventPayload) {
    const delivery = await this.repository.findByOrderId(orderId);

    await this.tx.run(async () => {
      // Make a request for shipping
      await this.courier.pickup({
        orderId,
      });

      // Dispatch event
      await this.outbox.save({
        type: CourierDispatchRequestedEventType,
        payload: {
          orderId,
        } satisfies CourierDispatchRequestedEventPayload,
      });
    });
  }
}
