import { AuthenticatedUser } from './src/contracts/authentication';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}
