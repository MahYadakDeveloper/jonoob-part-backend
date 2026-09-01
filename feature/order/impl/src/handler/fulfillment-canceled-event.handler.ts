import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import {
  OrderFulfillmentCanceledEventPayload,
  OrderFulfillmentCanceledEventType,
} from '@feature/order-fulfillment-api';
import { type PaymentApi } from '@feature/order-payment-api';
import { Injectable } from '@nestjs/common';
import { type OrderRepository } from '../order.repository';

@Injectable()
export class OrderFulfillmentCanceledEventHandler extends BaseEventHandler<OrderFulfillmentCanceledEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly payment: PaymentApi,
    private readonly repository: OrderRepository,
  ) {
    super(registry, OrderFulfillmentCanceledEventType);
  }

  async handle(payload: OrderFulfillmentCanceledEventPayload) {
    const order = await this.repository.find(payload.orderId);

    if (!order) throw new Error();
    if (order.status !== 'process') throw new Error();

    await this.payment.refund({
      sessionId: order.payment.sessionId,
      customerId: order.customerId,
    });

    await this.repository.markAs(order.id, 'canceled_by_merchant');
  }
}
