import { AuthenticatedUser } from './auth.type';

export interface AuthenticationResult {
  user: AuthenticatedUser;
}

export interface AuthenticationApi {
  authenticate(req: { token: string }): Promise<AuthenticationResult | null>;
}
