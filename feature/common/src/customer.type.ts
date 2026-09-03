import { CustomerType } from '@feature/common';

export type CustomerContact = {
  fullName: string;
  type: CustomerType;
  phone: string;
};

export type CustomerAddress =
  | {
      scope: 'intra_city';
      coordinate?: {
        longitude: number;
        latitude: number;
      };
      cityId: string;
      address: string;
    }
  | {
      scope: 'inter_city';
      provinceId: string;
      cityId: string;
      address: string;
      postalCode: string;
    };
