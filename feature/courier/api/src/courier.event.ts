export const PackageHandedOverToCourierEventType = 'courier:package-handed-over-to-courier';

export type PackageHandedOverToCourierEventPayload = {
  orderId: string;
  occurredAt: Date;
};
