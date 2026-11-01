import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from '../authenticated-user';
import { AUTH_POLICY, AuthPolicy } from '../authentication-policy';
import { JwtAuthService } from '../jwt-auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtAuthService,
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

    const user = await this.authenticate(token);
    if (!user) throw new UnauthorizedException();

    request.user = user;
    return true;
  }

  private async authenticate(token: string) {
    try {
      return await this.jwt.verify<AuthenticatedUser>(token, 'access');
    } catch {}
    return null;
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
