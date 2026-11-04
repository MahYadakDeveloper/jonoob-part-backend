import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  MongoQuery,
} from '@casl/ability';
import { AuthenticatedUser } from '@feature/authentication-http';
import { AbilityFactory } from '@feature/authorization-http/contracts';

export type ProcurementAction = 'manage' | 'read';

// TODO: replace with the real Procurement domain type
export type ProcurementSubjectType = Record<string, unknown> & {
  __typename: 'Procurement';
};

export type ProcurementSubject = 'Procurement' | ProcurementSubjectType;

export type ProcurementAbilityTuple = [ProcurementAction, ProcurementSubject];

export type ProcurementAbility = MongoAbility<
  ProcurementAbilityTuple,
  MongoQuery
>;

export class ProcurementAbilityFactory implements AbilityFactory<ProcurementAbility> {
  createFor(user: AuthenticatedUser): ProcurementAbility {
    const { can, build } = new AbilityBuilder(
      createMongoAbility<ProcurementAbilityTuple, MongoQuery>,
    );

    switch (user.role) {
      case 'admin':
      case 'manager':
        can('manage', 'Procurement');
        break;

      case 'customer':
        // can('read', 'Procurement', { customerId: user.id });
        break;

      case 'courier':
        break;
    }

    return build({ detectSubjectType: (object) => object.__typename });
  }
}
