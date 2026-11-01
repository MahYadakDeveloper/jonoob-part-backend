import {
  PolicyContext,
  PolicyHandler,
} from '@feature/authorization-http/contracts';
import { RegistrationAbility } from './registration.ability-factory';

export class ResetManagerPasswordPolicy implements PolicyHandler<RegistrationAbility> {
  async handle(
    ability: RegistrationAbility,
    _context: PolicyContext,
  ): Promise<boolean> {
    return ability.can('manager-password-reset', 'Registration');
  }
}
