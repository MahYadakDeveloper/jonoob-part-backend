import 'fastify';
import { AuthenticatedUser } from './src/authenticated-user';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}
