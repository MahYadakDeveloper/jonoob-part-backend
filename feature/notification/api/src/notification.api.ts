export interface NotificationApi {
  notifyDeliveryInProgress(req: { customerId: string; code: string }): Promise<void>;
}
