import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import {
  type QuarantinesPageQuery,
  quarantinesPageQuerySchema,
} from './quarantine.schemas';
import { StockQuarantineService } from './quarantine.service';

// @UseGuards(AuthGuard, PoliciesGuard)
@Controller('warehouse/quarantine')
export class StockQuarantineController {
  constructor(
    private readonly stockQuarantineService: StockQuarantineService,
  ) {}

  // @CheckPolicies({
  //   abilityFactory: QuarantineAbilityFactory,
  //   handlers: [QuarantineManagePolicyHandler],
  // })
  @Get()
  page(
    @Query({ schema: quarantinesPageQuerySchema })
    criteria: QuarantinesPageQuery,
  ) {
    return this.stockQuarantineService.page(criteria);
  }

  // @CheckPolicies({
  //   abilityFactory: QuarantineAbilityFactory,
  //   handlers: [QuarantineManagePolicyHandler],
  // })
  @Delete(':id')
  release(@Param('id', { schema: z.uuid() }) quarantineId: string) {
    return this.stockQuarantineService.release(quarantineId);
  }
}
