import { PolicyContext, PolicyHandler } from '@feature/shared/contracts/policy';
import { Logger } from '@nestjs/common';
import { StockAbility } from './stock-ability';

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
