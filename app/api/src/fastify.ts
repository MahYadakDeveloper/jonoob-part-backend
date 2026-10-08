import type { AuthenticatedUser } from '@feature/authentication-api';
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}
