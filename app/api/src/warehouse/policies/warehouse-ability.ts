import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
  type MongoQuery,
} from '@casl/ability';

import type { AuthenticatedUser } from '@feature/authentication-api';
import type { AbilityFactory } from '@feature/authorization-api';

export type WarehouseAction = 'manage';

export type WarehouseSubject = 'Warehouse';

export type WarehouseAbilityTuple = [WarehouseAction, WarehouseSubject];

export type WarehouseAbility = MongoAbility<WarehouseAbilityTuple, MongoQuery>;

export class WarehouseAbilityFactory implements AbilityFactory<WarehouseAbility> {
  createFor(user: AuthenticatedUser): WarehouseAbility {
    const { can, build } = new AbilityBuilder(
      createMongoAbility<WarehouseAbilityTuple, MongoQuery>,
    );

    switch (user.role) {
      case 'admin':
      case 'manager':
        can('manage', 'Warehouse');
        break;

      case 'customer':
        break;

      case 'courier':
        break;
    }

    return build();
  }
}
