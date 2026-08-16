export type PickupRequest =
  | {
      courierId: string;
      scope: 'intra-city';
      recipient: {
        fullName: string;
        phone: string;
        address: string;
        coordinate: {
          longitude: number;
          latitude: number;
        };
      };
    }
  | {
      courierId: string;
      scope: 'inter-city';
      carrier: {
        id: string;
        displayName: string;
        dropOfAddress: string;
      };
      extra?: string;
    };
