import { AuthenticatedUser } from './auth.type';

export interface AuthenticationApi {
  authenticate(token: string): Promise<AuthenticatedUser | null>;
}
