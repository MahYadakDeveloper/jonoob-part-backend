import { Module } from '@nestjs/common';

import { RegistrationCommand } from './commands/register-manager.cmd';
import { RegistrationController } from './registration.controller';

@Module({
  controllers: [RegistrationController],
  providers: [RegistrationCommand],
})
export class RegistrationHttpModule {}
