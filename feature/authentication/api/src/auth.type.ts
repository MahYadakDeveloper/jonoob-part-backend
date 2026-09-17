import { CustomerType } from '@feature/common';

export type AuthenticatedUser =
  | ({
      id: string;
      fullName: string;
      phoneNumber: string;
    } & (
      | {
          role: 'customer';
          type: CustomerType;
        }
      | {
          role: 'courier';
        }
      | {
          role: 'manager';
        }
    ))
  | {
      role: 'admin';
    };
