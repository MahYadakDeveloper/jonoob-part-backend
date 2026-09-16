import { CustomerType } from './types';

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
