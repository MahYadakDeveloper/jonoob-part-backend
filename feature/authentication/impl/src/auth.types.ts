import { CustomerType } from '@feature/common';

export type AuthClaims =
  | {
      role: 'customer';
      customer: {
        id: string;
        phoneNumber: string;
        type: CustomerType;
      };
    }
  | {
      role: 'courier';
      courier: {
        id: string;
      };
    }
  | {
      role: 'manager';
      manager: {
        id: string;
      };
    }
  | {
      role: 'admin';
    };
