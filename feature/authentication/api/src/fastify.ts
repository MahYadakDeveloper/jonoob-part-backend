import 'fastify';
import type { AuthenticatedUser } from './auth.type';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}
