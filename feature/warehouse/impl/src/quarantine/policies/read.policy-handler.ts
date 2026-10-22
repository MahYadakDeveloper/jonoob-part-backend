import { PolicyContext, PolicyHandler } from '@feature/shared/contracts/policy';
import { QuarantineAbility } from './quarantine-ability';

export class QuarantineManagePolicyHandler implements PolicyHandler<QuarantineAbility> {
  async handle(
    ability: QuarantineAbility,
    context: PolicyContext,
  ): Promise<boolean> {
    return (
      ability.can('review', 'Quarantine') &&
      ability.can('release', 'Quarantine')
    );
  }
}
