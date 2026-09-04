export interface NotificationApi {
  notifyCustomerPackageIsOnItsWay(req: { customerId: string; code: string }): Promise<void>;
  notifyCouriersOfPickupRequested(): Promise<void>;
}
