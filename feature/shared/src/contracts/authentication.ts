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

export enum AuthPolicy {
  Required = 'required', // Default
  Optional = 'optional',
  Public = 'public',
}

export const AUTH_POLICY = 'auth:policy';

export const Required = () => SetMetadata(AUTH_POLICY, AuthPolicy.Required);
export const OptionalAuth = () => SetMetadata(AUTH_POLICY, AuthPolicy.Optional);
export const Public = () => SetMetadata(AUTH_POLICY, AuthPolicy.Public);
