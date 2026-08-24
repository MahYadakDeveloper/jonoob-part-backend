import { FindManyProductResponse } from '@feature/catalog-api';
import { InvoiceItem, LineItems } from '@feature/common';
import { Customer } from '@feature/customer-api';
import { Delivery, OrderStatus } from './order.type';

export interface OrderApi {
  getDeliveryConfirmationCodeOfHandedPackageOver(req: {
    orderId: string;
  }): Promise<{ code: string }>;
  getDeliveryAddress(req: { orderId: string }): Promise<{ delivery: Delivery }>;
  getRecipientInformation(req: {
    orderId: string;
  }): Promise<{ customer: { id: string } & Customer; delivery: Delivery }>;

  getOrderItems({ orderId }: { orderId: string }): Promise<{ items: LineItems<InvoiceItem> }>;
  getOrderStatus({ orderId }: { orderId: string }): Promise<{
    status: OrderStatus;
  }>;

  calculateReserveStock(
    items: LineItems<{ productId: string; quantity: number }>,
    products: FindManyProductResponse['products'],
  ): LineItems<{ goodId: string; quantity: number }>;
}
