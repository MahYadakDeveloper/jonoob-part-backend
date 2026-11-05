import { MongoAbility } from '@casl/ability';
import { AuthenticatedUser } from '@feature/authentication-http';

export interface AbilityFactory<TAbility extends MongoAbility> {
  createFor(user: AuthenticatedUser): TAbility;
}
