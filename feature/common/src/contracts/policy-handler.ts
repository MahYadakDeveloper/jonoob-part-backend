import { MongoAbility } from '@casl/ability';
import { PolicyContext } from './policy-context';

export interface PolicyHandler<TAbility extends MongoAbility> {
  handle(ability: TAbility, context: PolicyContext): Promise<boolean>;
}
