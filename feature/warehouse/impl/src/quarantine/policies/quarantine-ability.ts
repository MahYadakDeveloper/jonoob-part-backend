import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
  type MongoQuery,
} from '@casl/ability';
import { AbilityFactory } from '@feature/shared/contracts/ability-factory';
import { AuthenticatedUser } from '@feature/shared/types/authenticated-user';

export type QuarantineAction = 'review' | 'release';

export type QuarantineSubject = 'Quarantine';

export type QuarantineAbilityTuple = [QuarantineAction, QuarantineSubject];

export type QuarantineAbility = MongoAbility<
  QuarantineAbilityTuple,
  MongoQuery
>;

export class QuarantineAbilityFactory implements AbilityFactory<QuarantineAbility> {
  createFor(user: AuthenticatedUser): QuarantineAbility {
    const { can, build } = new AbilityBuilder(
      createMongoAbility<QuarantineAbilityTuple, MongoQuery>,
    );

    switch (user.role) {
      case 'admin':
      case 'manager':
        can('review', 'Quarantine');
        can('release', 'Quarantine');
        break;

      case 'customer':
        break;

      case 'courier':
        break;
    }

    return build();
  }
}
