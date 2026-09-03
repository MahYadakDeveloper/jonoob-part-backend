import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type TransactionManager,
} from '@feature/common';
import { type FulfillmentApi } from '@feature/order-fulfillment-api';
import { PaymentFailedEventPayload, PaymentFailedEventType } from '@feature/order-payment-api';
import { Injectable } from '@nestjs/common';
import { type OrderRepository } from '../order.repository';

@Injectable()
export class PaymentFailedEventHandler extends BaseEventHandler<PaymentFailedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: OrderRepository,
    private readonly tx: TransactionManager,
    private readonly fulfillment: FulfillmentApi,
  ) {
    super(registry, PaymentFailedEventType);
  }

  async handle(payload: PaymentFailedEventPayload) {
    await this.tx.run(async () => {
      await this.fulfillment.cancel({ orderId: payload.orderId });
      await this.repository.markAs(payload.orderId, 'unsuccessful_pay');
    });
  }
}
