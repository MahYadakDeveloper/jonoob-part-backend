export const PackageHandedOverToCourierEventType = 'courier:package-handed-over-to-courier';

export type PackageHandedOverToCourierEventPayload = {
  courierId: string;
  orderId: string;
  handedOverAt: Date;
};
