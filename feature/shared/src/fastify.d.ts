import 'fastify';
import type { AuthenticatedUser } from './types/authenticated-user';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}
