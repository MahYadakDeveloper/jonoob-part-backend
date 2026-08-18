import { type CatalogApi } from '@feature/catalog-api';
import { BaseEventHandler, LineItems, type EventHandlerRegistry } from '@feature/common';
import { OrderEventPayload, OrderPaidEventType, type OrderApi } from '@feature/order-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { type ProcessingOrderRepository } from '../process.repository';

@Injectable()
export class OrderPaidEventHandler extends BaseEventHandler<OrderEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: ProcessingOrderRepository,
    private readonly order: OrderApi,
    private readonly warehouse: WarehouseApi,
    private readonly catalog: CatalogApi,
  ) {
    super(registry, OrderPaidEventType);
  }

  async handle({ orderId }: OrderEventPayload) {
    const { order } = await this.order.findById({ orderId });

    await this.repository.enqueue(orderId);
  }
}
