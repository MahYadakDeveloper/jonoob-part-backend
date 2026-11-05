import { MongoAbility } from '@casl/ability';
import { SetMetadata } from '@nestjs/common';
import { PolicyDefinition } from '../contracts';

export const CHECK_POLICIES_KEY = 'check_policy';

export const CheckPolicies = <TAbility extends MongoAbility>(
  definition: PolicyDefinition<TAbility>,
) => SetMetadata(CHECK_POLICIES_KEY, definition);
