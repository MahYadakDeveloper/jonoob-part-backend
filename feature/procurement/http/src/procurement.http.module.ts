import { Module } from '@nestjs/common';

import { ProcurementCommand } from './commands/procurement.cmd';
import { ProcurementController } from './procurement.controller';

@Module({
  controllers: [ProcurementController],
  providers: [ProcurementCommand],
})
export class ProcurementHttpModule {}
