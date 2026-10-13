import { AuthenticatedUser } from '../types/authenticated-user';

export interface AuthenticationApi {
  authenticate({
    token,
  }: {
    token: string;
  }): Promise<{ user: AuthenticatedUser } | null>;
}
