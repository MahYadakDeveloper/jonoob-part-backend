import { LineItems } from '@feature/common';

export interface FulfillmentApi {
  initialize(req: {
    orderId: string;
    items: LineItems<{ productId: string; quantity: number }>;
  }): Promise<void>;
  fulfill(req: { orderId: string }): Promise<void>;
  cancel({ orderId }: { orderId: string }): Promise<void>;
}
