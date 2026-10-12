import { CustomerType } from './customer-type';

export type AuthenticatedUser =
  | ({
      id: string;
      fullName: string;
      phone: string;
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
