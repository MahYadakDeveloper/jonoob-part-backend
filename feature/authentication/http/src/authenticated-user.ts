import { SetMetadata } from '@nestjs/common';

export type AuthenticatedUser =
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
    ))
  | {
      role: 'admin';
    };
