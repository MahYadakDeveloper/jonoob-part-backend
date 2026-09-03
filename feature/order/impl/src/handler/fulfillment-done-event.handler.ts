import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type TransactionManager,
} from '@feature/common';
import { type DeliveryApi } from '@feature/order-delivery-api';
import {
  OrderFulfillmentDoneEventPayload,
  OrderFulfillmentDoneEventType,
} from '@feature/order-fulfillment-api';
import { Injectable } from '@nestjs/common';
import { type OrderRepository } from '../order.repository';

@Injectable()
export class OrderFulfillmentDoneHandler extends BaseEventHandler<OrderFulfillmentDoneEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly delivery: DeliveryApi,
    private readonly repository: OrderRepository,
    private readonly tx: TransactionManager,
  ) {
    super(registry, OrderFulfillmentDoneEventType);
  }

  async handle({ orderId }: OrderFulfillmentDoneEventPayload) {
    await this.tx.run(async () => {
      await this.delivery.deliver({ orderId });
      await this.repository.markAs(orderId, 'in_delivery');
    });
  }
}
