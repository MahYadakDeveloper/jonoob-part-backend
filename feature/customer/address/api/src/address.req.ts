export type AddAddressRequest = {
  customerId: string;
} & (
  | {
      scope: 'inter_city';
      provinceId: number;
      cityId: number;
      address: string;
      postalCode: string;
    }
  | {
      scope: 'intra_city';
      provinceId: number;
      cityId: number;
      coordinate?: {
        longitude: number;
        latitude: number;
      };

      address: string;
    }
);
