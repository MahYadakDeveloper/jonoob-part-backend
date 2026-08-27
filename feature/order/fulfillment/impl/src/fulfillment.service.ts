import { type CatalogApi } from '@feature/catalog-api';
import { LineItems } from '@feature/common';
import { type OrderApi } from '@feature/order-api';
import { Injectable } from '@nestjs/common';
import { type ProcessingOrderRepository } from './process.repository';

@Injectable()
export class ProcessingService {
  constructor(
    private readonly repository: ProcessingOrderRepository,
    private readonly order: OrderApi,
    private readonly catalog: CatalogApi,
  ) {}

  listOrdersReadyForProcessing() {
    return this.repository.listReadyForProcessing();
  }

  async process({
    orderId,
    pickedStocks,
  }: {
    orderId: string;
    pickedStocks: LineItems<{ goodId: string; quantity: number }>;
  }) {
    const { items } = await this.order.getOrderItems({ orderId });
    const { products } = await this.catalog.findMany({ productIds: [...items.keys()] });

    const requiredStocks = this.order.calculateReserveStock(items, products);

    if (!requiredStocks.equals(pickedStocks, (a, b) => a.quantity === b.quantity)) {
      throw new Error('Processed stocks do not match required stocks');
    }
  }

  async cancel({ orderId, reason }: { orderId: string; reason: string }) {}
}
