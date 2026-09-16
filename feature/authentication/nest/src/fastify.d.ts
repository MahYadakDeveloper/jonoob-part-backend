import type { AuthenticatedUser } from '@feature/authentication-api';

export declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}
