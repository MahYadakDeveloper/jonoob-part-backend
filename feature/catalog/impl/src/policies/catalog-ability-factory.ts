import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
  type MongoQuery,
} from '@casl/ability';

import type { AuthenticatedUser } from '@feature/authentication-api';
import type { AbilityFactory } from '@feature/authorization-api';

export type CatalogAction = 'manage' | 'read';

export type CatalogSubject = 'Catalog';

export type CatalogAbilityTuple = [CatalogAction, CatalogSubject];

export type CatalogAbility = MongoAbility<CatalogAbilityTuple, MongoQuery>;

export class CatalogAbilityFactory implements AbilityFactory<CatalogAbility> {
  createFor(user: AuthenticatedUser): CatalogAbility {
    const { can, build } = new AbilityBuilder(createMongoAbility<CatalogAbilityTuple, MongoQuery>);

    switch (user.role) {
      case 'admin':
      case 'manager':
        can('read', 'Catalog');
        can('manage', 'Catalog');

        break;

      case 'customer':
        can('read', 'Catalog');

        break;

      case 'courier':
        break;
    }

    return build();
  }
}
