import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from '../contracts/authentication';

export const User = createParamDecorator(
  (_data, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();

    return request.user;
  },
);
