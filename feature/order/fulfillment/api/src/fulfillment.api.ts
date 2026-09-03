export interface FulfillmentApi {
  fulfill(req: { orderId: string }): Promise<void>;
  cancel({ orderId }: { orderId: string }): Promise<void>;
}
