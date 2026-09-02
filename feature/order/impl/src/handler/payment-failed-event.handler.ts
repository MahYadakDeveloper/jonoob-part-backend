import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type TransactionManager,
} from '@feature/common';
import { PaymentFailedEventPayload, PaymentFailedEventType } from '@feature/order-payment-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { type OrderRepository } from '../order.repository';

@Injectable()
export class PaymentFailedEventHandler extends BaseEventHandler<PaymentFailedEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: OrderRepository,
    private readonly tx: TransactionManager,
    private readonly warehouse: WarehouseApi,
  ) {
    super(registry, PaymentFailedEventType);
  }

  async handle(payload: PaymentFailedEventPayload) {
    const order = await this.repository.findBySessionId(payload.sessionId);

    await this.tx.run(async () => {
      await this.warehouse.releaseStockByRefId({ referenceId: order.id });
      await this.repository.markAs(order.id, 'payment_not_completed');
    });
  }
}
