import { PolicyContext } from '@feature/shared/contracts/policy-context';
import { PolicyHandler } from '@feature/shared/contracts/policy-handler';
import { StockAbility } from './stock-ability';
import { Logger } from '@nestjs/common';

export class StockManagementPolicyHandler implements PolicyHandler<StockAbility> {
  private readonly Logger = new Logger(StockManagementPolicyHandler.name);
  async handle(
    ability: StockAbility,
    context: PolicyContext,
  ): Promise<boolean> {
    this.Logger.log('body: ', context.body);
    return ability.can('manage', 'Stock');
  }
}
