import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import {
  AUTHENTICATION_API,
  type AuthenticationApi,
} from '../contracts/authentication.api';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTHENTICATION_API)
    private readonly authentication: AuthenticationApi,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    const { user } = await this.authentication.authenticate({
      token,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = user;

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
