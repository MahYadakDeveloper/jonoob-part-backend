import {
  PolicyContext,
  PolicyHandler,
} from '@feature/authorization-http/contracts';
import { ProcurementAbility } from './procurement.ability-factory';

export class ProcurementManagementPolicy implements PolicyHandler<ProcurementAbility> {
  async handle(ability: ProcurementAbility, _context: PolicyContext): Promise<boolean> {
    return ability.can('manage', 'Procurement');
  }
}
