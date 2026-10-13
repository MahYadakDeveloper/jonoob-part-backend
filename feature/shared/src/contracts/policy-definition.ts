import { Type } from '@nestjs/common';
import { AbilityFactory } from './ability-factory';
import { PolicyHandler } from './policy-handler';
import { MongoAbility } from '@casl/ability';

export interface PolicyDefinition<TAbility extends MongoAbility> {
  abilityFactory: Type<AbilityFactory<TAbility>>;
  handlers: Type<PolicyHandler<TAbility>>[];
}
