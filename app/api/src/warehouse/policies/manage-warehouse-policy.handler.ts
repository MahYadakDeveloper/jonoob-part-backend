import { PolicyContext, PolicyHandler } from '@feature/authorization-api';
import { WarehouseAbility } from './warehouse-ability';

export class ManageWarehousePolicy implements PolicyHandler<WarehouseAbility> {
  async handle(
    ability: WarehouseAbility,
    context: PolicyContext,
  ): Promise<boolean> {
    return ability.can('manage', 'Warehouse');
  }
}
