import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
  type MongoQuery,
} from '@casl/ability';
import { AuthenticatedUser } from '@feature/shared/contracts/authentication';
import { AbilityFactory } from '@feature/shared/contracts/policy';
import { Logger } from '@nestjs/common';

export type StockAction = 'manage';

export type StockSubject = 'Stock';

export type StockAbilityTuple = [StockAction, StockSubject];

export type StockAbility = MongoAbility<StockAbilityTuple, MongoQuery>;

export class StockAbilityFactory implements AbilityFactory<StockAbility> {
  private readonly logger = new Logger(StockAbilityFactory.name);

  createFor(user: AuthenticatedUser): StockAbility {
    const { can, build } = new AbilityBuilder(
      createMongoAbility<StockAbilityTuple, MongoQuery>,
    );

    this.logger.log('user', user);

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
