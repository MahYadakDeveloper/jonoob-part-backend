import { StockQuarantineService } from '../services/quarantine.service';
import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import {
  type QuarantinesPageQuery,
  quarantinesPageQuerySchema,
} from './schema/quarantine.schemas';

@Controller('warehouse/quarantine')
export class StockQuarantineController {
  constructor(
    private readonly stockQuarantineService: StockQuarantineService,
  ) {}

  @Get()
  page(
    @Query({ schema: quarantinesPageQuerySchema })
    criteria: QuarantinesPageQuery,
  ) {
    return this.stockQuarantineService.page(criteria);
  }

  @Delete(':id')
  release(@Param('id', { schema: z.uuid() }) quarantineId: string) {
    return this.stockQuarantineService.release(quarantineId);
  }
}
