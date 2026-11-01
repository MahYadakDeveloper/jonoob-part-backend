import { BunPasswordHasher } from '@infra/crypto/password-hasher';
import { BullmqSms } from '@infra/messaging-sms';
import { DynamicModule, Type } from '@nestjs/common';
import { RegisterCourierCommand } from './commands/register-courier.cmd';
import { RegisterManagerCommand } from './commands/register-manager.cmd';
import { ResetManagerPasswordByAdminCommand } from './commands/reset-manager-password-by-admin.cmd';
import { ResetManagerPasswordCommand } from './commands/reset-manager-password.cmd';
import { UnregisterUserCommand } from './commands/unregister-user.cmd';
import { RegistrationController } from './registration.controller';

interface RegistrationModuleOptions {
  imports: NonNullable<DynamicModule['imports']>;
  providers: [Type<BunPasswordHasher>, ...Type<any>[]];
}

export class RegistrationHttpModule {
  static forFeature(options: RegistrationModuleOptions): DynamicModule {
    return {
      module: RegistrationHttpModule,
      imports: options.imports ?? [],
      controllers: [RegistrationController],
      providers: [
        ...options.providers,
        BullmqSms,
        RegisterCourierCommand,
        RegisterManagerCommand,
        UnregisterUserCommand,
        ResetManagerPasswordByAdminCommand,
        ResetManagerPasswordCommand,
      ],
    };
  }
}
