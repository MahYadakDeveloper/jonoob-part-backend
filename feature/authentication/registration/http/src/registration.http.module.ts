import { Module } from '@nestjs/common';
import { RegisterCourierCommand } from './commands/register-courier.cmd';
import { RegisterManagerCommand } from './commands/register-manager.cmd';
import { ResetManagerPasswordByAdminCommand } from './commands/reset-manager-password-by-admin.cmd';
import { ResetManagerPasswordCommand } from './commands/reset-manager-password.cmd';
import { UnregisterUserCommand } from './commands/unregister-user.cmd';
import { RegistrationController } from './registration.controller';

@Module({
  controllers: [RegistrationController],
  providers: [
    RegisterCourierCommand,
    RegisterManagerCommand,
    UnregisterUserCommand,
    ResetManagerPasswordByAdminCommand,
    ResetManagerPasswordCommand,
  ],
})
export class RegistrationHttpModule {}
