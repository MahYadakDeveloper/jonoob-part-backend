import {
  BaseEventHandler,
  type EventHandlerRegistry,
  type TransactionManager,
} from '@feature/common';
import { OrderCanceledEventType, OrderEventPayload } from '@feature/order-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { type FulfillmentRepository } from '../fulfillment.repository';

@Injectable()
export class OrderCanceledEventHandler extends BaseEventHandler<OrderEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: FulfillmentRepository,
    private readonly warehouse: WarehouseApi,
    private readonly tx: TransactionManager,
  ) {
    super(registry, OrderCanceledEventType);
  }

  async handle({ orderId }: OrderEventPayload) {
    const fulfillment = await this.repository.find(orderId);
    // This check switch statement is necessarily and important
    await this.tx.run(async () => {
      if (fulfillment.status === 'processed') {
        await this.warehouse.receiptGoods({
          reference: {
            source: 'order',
            id: orderId,
          },
          items: fulfillment.items,
        });
      }

      await this.repository.dequeue(orderId, { status: 'canceled_by_customer' });
    });
  }
}
