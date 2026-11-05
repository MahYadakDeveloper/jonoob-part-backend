import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from '../authenticated-user';

export const CurrentUser = createParamDecorator(
  (_data, ctx: ExecutionContext): AuthenticatedUser | undefined =>
    ctx.switchToHttp().getRequest<FastifyRequest>().user,
);
