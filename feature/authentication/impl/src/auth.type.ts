import { CustomerType } from '@feature/actors-api/customer';

export type RefreshClaim =
  | {
      role: 'admin';
    }
  | ({
      id: string;
    } & (
      | {
          role: 'customer';
        }
      | {
          role: 'courier';
        }
      | {
          role: 'manager';
        }
    ));
