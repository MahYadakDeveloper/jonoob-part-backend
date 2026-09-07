import { CustomerType } from '@feature/common';

export type CustomerContact = {
  type: CustomerType;
  fullName: string;
  phoneNumber: string;
};

export type CustomerAddress =
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
    };
