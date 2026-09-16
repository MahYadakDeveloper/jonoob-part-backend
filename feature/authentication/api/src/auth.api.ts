import { AuthenticatedUser } from '@feature/common';

export interface AuthenticationResult {
  user: AuthenticatedUser;
}

export interface AuthenticationApi {
  authenticate(req: { token: string }): Promise<AuthenticationResult | null>;
}
