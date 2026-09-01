import { LineItems } from '@feature/common';
import { type OrderApi } from '@feature/order-api';
import { Injectable } from '@nestjs/common';
import { type FulfillmentRepository } from './fulfillment.repository';

@Injectable()
export class ProcessingService {
  constructor(
    private readonly repository: FulfillmentRepository,
    private readonly order: OrderApi,
  ) {}

  listOrdersReadyForProcessing() {
    return this.repository.listReadyForProcessing();
  }

  async markAsProcess({
    orderId,
    pickedStocks,
  }: {
    orderId: string;
    pickedStocks: LineItems<{ goodId: string; quantity: number }>;
  }) {
    const { items } = await this.order.getReservedItems({ orderId });

    if (!items.equals(pickedStocks, (a, b) => a.quantity === b.quantity)) {
      throw new Error('Processed stocks do not match required stocks');
    }
  }

  async cancel({ orderId, reason }: { orderId: string; reason: string }) {}
}
