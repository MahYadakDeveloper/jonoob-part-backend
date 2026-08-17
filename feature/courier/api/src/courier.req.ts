export type PickupRequest = { orderId: string } & (
  | {
      scope: 'intra-city';
      recipient: {
        fullName: string;
        phone: string;
        address: string;
        coordinate?: {
          longitude: number;
          latitude: number;
        };
      };
    }
  | {
      scope: 'inter-city';
      carrier: {
        provider: string; // unique and in latin
        displayName: string;
        dropOffAddress: string;
      };
    }
);
