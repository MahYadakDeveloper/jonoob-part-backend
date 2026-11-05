import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  MongoQuery,
} from '@casl/ability';
import { AuthenticatedUser } from '@feature/authentication-http';
import { AbilityFactory } from '@feature/authorization-http/contracts';

export type RegistrationAction =
  | 'register_unregister'
  | 'manager-password-reset'
  | 'manager-password-reset-by-admin';

export type RegistrationSubject = 'Registration';

export type RegistrationAbilityTuple = [
  RegistrationAction,
  RegistrationSubject,
];

export type RegistrationAbility = MongoAbility<
  RegistrationAbilityTuple,
  MongoQuery
>;

export class RegistrationAbilityFactory implements AbilityFactory<RegistrationAbility> {
  createFor(user: AuthenticatedUser): RegistrationAbility {
    const { can, build } = new AbilityBuilder(
      createMongoAbility<RegistrationAbilityTuple, MongoQuery>,
    );

    switch (user.role) {
      case 'admin':
        can('register_unregister', 'Registration');
        can('manager-password-reset-by-admin', 'Registration');
        break;
      case 'manager':
        can('manager-password-reset', 'Registration');
        break;
    }

    return build();
  }
}
