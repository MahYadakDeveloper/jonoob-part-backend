import { MongoAbility } from '@casl/ability';
import '@feature/authentication-api';
import { PolicyContext, PolicyDefinition } from '@feature/authorization-api';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { CHECK_POLICIES_KEY } from './check-policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const definition = this.reflector.get<PolicyDefinition<MongoAbility>>(
      CHECK_POLICIES_KEY,
      context.getHandler(),
    );

    if (!definition) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const user = request.user;

    const abilityFactory = this.moduleRef.get(definition.abilityFactory, { strict: false });

    const ability = abilityFactory.createFor(user);

    const policyContext = this.createPolicyContext(request);

    for (const Handler of definition.handlers) {
      const handler = this.moduleRef.get(Handler, { strict: false });

      const allowed = await handler.handle(ability, policyContext);

      if (!allowed) {
        return false;
      }
    }

    return true;
  }

  private createPolicyContext(request: FastifyRequest): PolicyContext {
    return {
      params: request.params as Record<string, string>,
      query: request.query as Record<string, unknown>,
      body: request.body,
    };
  }
}
