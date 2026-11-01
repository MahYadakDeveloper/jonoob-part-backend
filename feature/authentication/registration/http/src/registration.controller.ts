import { CheckPolicies } from '@feature/authorization-http/decorators';
import { PoliciesGuard } from '@feature/authorization-http/guards';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { UserOf } from '@feature/authentication-http';
import { CurrentUser } from '@feature/authentication-http/decorators';
import { z } from 'zod';
import { RegisterCourierCommand } from './commands/register-courier.cmd';
import { RegisterManagerCommand } from './commands/register-manager.cmd';
import { ResetManagerPasswordByAdminCommand } from './commands/reset-manager-password-by-admin.cmd';
import { ResetManagerPasswordCommand } from './commands/reset-manager-password.cmd';
import { UnregisterUserCommand } from './commands/unregister-user.cmd';
import { RegisterAndUnregisterUsersPolicy } from './policy/register-users.policy';
import { RegistrationAbilityFactory } from './policy/registration.ability-factory';
import { ResetManagerPasswordByAdminPolicy } from './policy/reset-manager-password-by-admin.policy';
import { ResetManagerPasswordPolicy } from './policy/reset-manager-password.policy';
import {
  type RegisterUserDto,
  registerUserSchema,
  type ResetManagerPasswordDto,
  resetManagerPasswordSchema,
} from './registration.dto';

@UseGuards(PoliciesGuard)
@Controller('auth/registration')
export class RegistrationController {
  constructor(
    private readonly registerManagerCmd: RegisterManagerCommand,
    private readonly registerCourierCmd: RegisterCourierCommand,
    private readonly unregisterUserCmd: UnregisterUserCommand,
    private readonly resetManagerPasswordCmd: ResetManagerPasswordCommand,
    private readonly resetManagerPasswordByAdminCmd: ResetManagerPasswordByAdminCommand,
  ) {}

  // ------------------------------------------ manager

  @UseGuards(PoliciesGuard)
  @CheckPolicies({
    abilityFactory: RegistrationAbilityFactory,
    handlers: [RegisterAndUnregisterUsersPolicy],
  })
  @Post('managers/register')
  @HttpCode(HttpStatus.CREATED)
  registerManager(@Body({ schema: registerUserSchema }) dto: RegisterUserDto) {
    return this.registerManagerCmd.execute(dto);
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies({
    abilityFactory: RegistrationAbilityFactory,
    handlers: [RegisterAndUnregisterUsersPolicy],
  })
  @Post('managers/:id/unregister')
  @HttpCode(HttpStatus.OK)
  unregisterManager(@Param('id', { schema: z.uuid() }) id: string) {
    return this.unregisterUserCmd.execute({ id, usr: 'manager' });
  }

  @CheckPolicies({
    abilityFactory: RegistrationAbilityFactory,
    handlers: [ResetManagerPasswordByAdminPolicy],
  })
  @Post('manager/:id/reset-password-by-admin')
  resetManagerPasswordByAdmin(
    @Param('id', { schema: z.uuid() }) managerId: string,
  ) {
    return this.resetManagerPasswordByAdminCmd.execute({ managerId });
  }

  @CheckPolicies({
    abilityFactory: RegistrationAbilityFactory,
    handlers: [ResetManagerPasswordPolicy],
  })
  @Post('manager/reset-password')
  resetManagerPassword(
    @Body({ schema: resetManagerPasswordSchema }) dto: ResetManagerPasswordDto,
    @CurrentUser() user: UserOf<'manager'>,
  ) {
    return this.resetManagerPasswordCmd.execute({ ...dto, managerId: user.id });
  }

  // ------------------------------------ courier

  @UseGuards(PoliciesGuard)
  @CheckPolicies({
    abilityFactory: RegistrationAbilityFactory,
    handlers: [RegisterAndUnregisterUsersPolicy],
  })
  @Post('couriers/register')
  @HttpCode(HttpStatus.OK)
  registerCourier(@Body({ schema: registerUserSchema }) dto: RegisterUserDto) {
    return this.registerCourierCmd.execute(dto);
  }

  @UseGuards(PoliciesGuard)
  @CheckPolicies({
    abilityFactory: RegistrationAbilityFactory,
    handlers: [RegisterAndUnregisterUsersPolicy],
  })
  @Post('couriers/:id/unregister')
  @HttpCode(HttpStatus.OK)
  unregisterCourier(@Param('id', { schema: z.uuid() }) id: string) {
    return this.unregisterUserCmd.execute({ id, usr: 'courier' });
  }
}
