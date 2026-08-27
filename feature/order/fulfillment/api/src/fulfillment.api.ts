import { Fulfillment } from './fulfillment.type';

export interface FulfillmentApi {
  cancel({
    orderId,
  }: {
    orderId: string;
  }): Promise<{ fulfillment: Extract<Fulfillment, { status: 'canceled' }> }>;
}
