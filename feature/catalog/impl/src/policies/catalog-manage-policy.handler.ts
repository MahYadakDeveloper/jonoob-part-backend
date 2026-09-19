import { PolicyContext, PolicyHandler } from '@feature/authorization-api';
import { CatalogAbility } from './catalog-ability-factory';

export class CatalogManagementPolicyHandler implements PolicyHandler<CatalogAbility> {
  async handle(ability: CatalogAbility, context: PolicyContext): Promise<boolean> {
    return ability.can('manage', 'Catalog');
  }
}
