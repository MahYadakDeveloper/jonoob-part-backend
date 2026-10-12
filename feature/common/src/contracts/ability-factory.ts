import { MongoAbility } from '@casl/ability';
import { AuthenticatedUser } from '../types/authenticated-user';

export interface AbilityFactory<TAbility extends MongoAbility> {
  createFor(user: AuthenticatedUser): TAbility;
}
