import {
  AUTH_POLICY,
  AuthPolicy,
} from '@feature/shared/contracts/authentication';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authentication: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy =
      this.reflector.getAllAndOverride<AuthPolicy>(AUTH_POLICY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? AuthPolicy.Required;

    if (policy === AuthPolicy.Public) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      if (policy === AuthPolicy.Optional) return true;
      throw new UnauthorizedException();
    }

    const { user } = await this.authentication.authenticate({ token });
    if (!user) throw new UnauthorizedException();

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
