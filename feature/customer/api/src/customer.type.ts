import { CustomerType } from '@feature/common';

export type Customer = {
  fullName: string;
  type: CustomerType;
  phone: string;
};

export type CustomerAddress =
  | {
      scope: 'intra-city';
      coordinate?: {
        longitude: number;
        latitude: number;
      };
      cityId: string;
      address: string;
    }
  | {
      scope: 'inter-city';
      provinceId: string;
      cityId: string;
      address: string;
      postalCode: string;
    };
