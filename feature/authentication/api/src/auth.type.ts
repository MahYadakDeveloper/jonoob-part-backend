import { CustomerType } from '@feature/common';

export type AuthenticatedUser =
  | {
      role: 'customer';
      customer: {
        id: string;
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
