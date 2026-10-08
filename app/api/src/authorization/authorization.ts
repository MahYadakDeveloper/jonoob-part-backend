import { MongoAbility } from '@casl/ability';
import { AuthenticatedUser } from '@feature/authentication-api';
import { Type } from '@nestjs/common';

export interface AbilityFactory<TAbility extends MongoAbility> {
  createFor(user: AuthenticatedUser): TAbility;
}

export interface PolicyContext {
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
}

export interface PolicyHandler<TAbility extends MongoAbility> {
  handle(ability: TAbility, context: PolicyContext): Promise<boolean>;
}

export interface PolicyDefinition<TAbility extends MongoAbility> {
  abilityFactory: Type<AbilityFactory<TAbility>>;
  handlers: Type<PolicyHandler<TAbility>>[];
}
