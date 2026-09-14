import { CustomerType } from '@feature/common';

export type AuthClaims =
  | {
      principal: 'customer';
      customer: {
        id: string;
        phoneNumber: string;
        type: CustomerType;
      };
    }
  | {
      principal: 'manager';
      manager: {
        id: string;
      };
    }
  | {
      principal: 'admin';
    };
