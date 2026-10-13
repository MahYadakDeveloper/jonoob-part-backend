import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
  type MongoQuery,
} from '@casl/ability';
import { AbilityFactory } from '@feature/shared/contracts/ability-factory';
import { AuthenticatedUser } from '@feature/shared/types/authenticated-user';

export type StockAction = 'manage';

export type StockSubject = 'Stock';

export type StockAbilityTuple = [StockAction, StockSubject];

export type StockAbility = MongoAbility<StockAbilityTuple, MongoQuery>;

export class StockAbilityFactory implements AbilityFactory<StockAbility> {
  createFor(user: AuthenticatedUser): StockAbility {
    const { can, build } = new AbilityBuilder(
      createMongoAbility<StockAbilityTuple, MongoQuery>,
    );

    switch (user.role) {
      case 'admin':
      case 'manager':
        can('manage', 'Stock');
        break;

      case 'customer':
        break;

      case 'courier':
        break;
    }

    return build();
  }
}
