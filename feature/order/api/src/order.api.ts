import { FindManyProductResponse } from '@feature/catalog-api';
import { LineItems } from '@feature/common';

export interface OrderApi {
  // getDeliveryConfirmationCodeOfHandedPackageOver(req: {
  //   orderId: string;
  // }): Promise<{ code: string }>;
  // getOrderSummary(req: { orderId: string }): Promise<{ summary: InvoiceSummary }>;

  getReservedItems({
    orderId,
  }: {
    orderId: string;
  }): Promise<{ items: LineItems<{ goodId: string; quantity: number }> }>;

  adminCancelOrder(req: { orderId: string; reason: string }): Promise<void>;

  calculateReserveStock(
    items: LineItems<{ productId: string; quantity: number }>,
    products: FindManyProductResponse['products'],
  ): LineItems<{ goodId: string; quantity: number }>;
}
