import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { type AuthenticationApi } from '@feature/authentication-api';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly authentication: AuthenticationApi) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    const authentication = await this.authentication.authenticate({
      token,
    });

    if (!authentication) {
      throw new UnauthorizedException();
    }

    request.user = authentication.user;

    return true;
  }

  private extractBearerToken(request: FastifyRequest): string | null {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }
}
