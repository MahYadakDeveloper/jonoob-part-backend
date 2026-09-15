import { MongoAbility } from '@casl/ability';
import { SetMetadata } from '@nestjs/common';

interface IPolicyHandler {
  handle(ability: MongoAbility): boolean;
}

export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: IPolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
