import { Module } from '@nestjs/common';

/*
 * [NOTE]
 * Register the ability factory and policy handlers as providers.
 * PoliciesGuard resolves them through ModuleRef.
 *
 * AuthenticationGuard and PoliciesGuard do not need to be registered
 * as providers in the feature module. They are provided globally by the
 * application container and can be resolved by NestJS when used with
 * @UseGuards().
 *
 * The feature module only needs to register its ability factory and policy
 * handlers, which are resolved dynamically by PoliciesGuard through ModuleRef.
 */

@Module({
  providers: [],
})
export class OrderModule {}
