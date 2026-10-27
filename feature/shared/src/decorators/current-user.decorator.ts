import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from '../contracts/authentication';

export const CurrentUser = createParamDecorator(
  (_data, ctx: ExecutionContext): AuthenticatedUser | undefined =>
    ctx.switchToHttp().getRequest<FastifyRequest>().user,
);
