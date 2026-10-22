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

export interface AuthenticationInput {
  token: string;
}

export interface AuthenticationResult {
  user: AuthenticatedUser | null;
}

export const AUTHENTICATION_API = Symbol('AUTHENTICATION_API');

export interface AuthenticationApi {
  authenticate(input: AuthenticationInput): Promise<AuthenticationResult>;
}
