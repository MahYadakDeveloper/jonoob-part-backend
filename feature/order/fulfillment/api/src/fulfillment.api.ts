export interface FulfillmentApi {
  cancel({ orderId }: { orderId: string }): Promise<void>;
}
