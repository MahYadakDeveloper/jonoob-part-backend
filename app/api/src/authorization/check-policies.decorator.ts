import { MongoAbility } from '@casl/ability';
import { PolicyDefinition } from '@feature/authorization-api';
import { SetMetadata } from '@nestjs/common';

export const CHECK_POLICIES_KEY = 'check_policy';

export const CheckPolicies = <TAbility extends MongoAbility>(
  definition: PolicyDefinition<TAbility>,
) => SetMetadata(CHECK_POLICIES_KEY, definition);
