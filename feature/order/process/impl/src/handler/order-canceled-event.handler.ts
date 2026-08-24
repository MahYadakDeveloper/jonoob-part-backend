import { type CatalogApi } from '@feature/catalog-api';
import { BaseEventHandler, type EventHandlerRegistry } from '@feature/common';
import { OrderCanceledEventType, OrderEventPayload, type OrderApi } from '@feature/order-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { type ProcessingOrderRepository } from '../process.repository';

@Injectable()
export class OrderCanceledEventHandler extends BaseEventHandler<OrderEventPayload> {
  constructor(
    registry: EventHandlerRegistry,
    private readonly repository: ProcessingOrderRepository,
    private readonly order: OrderApi,
    private readonly warehouse: WarehouseApi,
    private readonly catalog: CatalogApi,
  ) {
    super(registry, OrderCanceledEventType);
  }

  async handle({ orderId }: OrderEventPayload) {
    const { status } = await this.order.getOrderStatus({ orderId });
    const { items } = await this.order.getOrderItems({ orderId });
    const { products } = await this.catalog.findMany({ productIds: [...items.keys()] });

    // This check switch statement is necessarily and important
    switch (status) {
      case 'process':
        await this.repository.remove(orderId);
        break;
      case 'courier-requested':
        const issued = this.order.calculateReserveStock(items, products);
        await this.warehouse.receiptGoods({
          reference: {
            source: 'order',
            id: orderId,
          },
          items: issued,
        });
        break;
    }
  }
}
