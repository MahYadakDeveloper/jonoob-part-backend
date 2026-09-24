export type CustomerAddress = { id: string } & (
  | {
      scope: 'intra_city';
      coordinate?: {
        longitude: number;
        latitude: number;
      };
      cityId: number;
      address: string;
    }
  | {
      scope: 'inter_city';
      provinceId: number;
      cityId: number;
      address: string;
      postalCode: string;
    }
);
