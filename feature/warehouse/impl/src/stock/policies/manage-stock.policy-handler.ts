import { PolicyContext } from '@feature/shared/contracts/policy-context';
import { PolicyHandler } from '@feature/shared/contracts/policy-handler';
import { StockAbility } from './stock-ability';

export class StockManagementPolicyHandler implements PolicyHandler<StockAbility> {
  async handle(
    ability: StockAbility,
    context: PolicyContext,
  ): Promise<boolean> {
    return ability.can('manage', 'Stock');
  }
}
