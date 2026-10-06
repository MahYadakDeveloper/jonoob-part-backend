import { StockQuarantineService } from '@/services/quarantine.service';
import { Controller, Get, Query } from '@nestjs/common';
import {
  type QuarantinesPageQuery,
  quarantinesPageQuerySchema,
} from './schema/quarantine.schemas';

@Controller('quarantine')
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
}
