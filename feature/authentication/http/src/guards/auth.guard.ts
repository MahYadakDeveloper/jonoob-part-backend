import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { AUTH_POLICY, AuthPolicy } from '../authentication-policy';
import authConfig from '../authentication.config';
import { AuthenticatedUser } from '../authenticated-user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    @Inject(authConfig.KEY)
    private readonly cfg: ConfigType<typeof authConfig>,
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
      return await this.jwt.verifyAsync<AuthenticatedUser>(token, {
        secret: this.cfg.accessSecret,
      });
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
