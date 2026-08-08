export const ManyPurchaseRecordEventType = 'procurement:many-purchase-record-event';

export type ManyPurchaseRecordEventPayload = {
  // for price cache tag invalidation
  goodIds: string[];
};
