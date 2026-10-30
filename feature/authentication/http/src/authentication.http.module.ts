import { Module } from '@nestjs/common';

import { AuthenticationCommand } from './commands/authentication.cmd';
import { AuthenticationController } from './authentication.controller';

@Module({
  controllers: [AuthenticationController],
  providers: [AuthenticationCommand],
})
export class AuthenticationHttpModule {}
