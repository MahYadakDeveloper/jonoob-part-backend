import { CheckPolicies } from '@feature/shared/decorators/check-policies.decorator';
import { AuthenticationGuard } from '@feature/shared/guards/auth.guard';
import { PoliciesGuard } from '@feature/shared/guards/policies.guard';
import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { QuarantineAbilityFactory } from './policies/quarantine-ability';
import { QuarantineManagePolicyHandler } from './policies/read.policy-handler';
import {
  type QuarantinesPageQuery,
  quarantinesPageQuerySchema,
} from './quarantine.schemas';
import { StockQuarantineService } from './quarantine.service';

@UseGuards(AuthenticationGuard, PoliciesGuard)
@Controller('warehouse/quarantine')
export class StockQuarantineController {
  constructor(
    private readonly stockQuarantineService: StockQuarantineService,
  ) {}

  @CheckPolicies({
    abilityFactory: QuarantineAbilityFactory,
    handlers: [QuarantineManagePolicyHandler],
  })
  @Get()
  page(
    @Query({ schema: quarantinesPageQuerySchema })
    criteria: QuarantinesPageQuery,
  ) {
    return this.stockQuarantineService.page(criteria);
  }

  @CheckPolicies({
    abilityFactory: QuarantineAbilityFactory,
    handlers: [QuarantineManagePolicyHandler],
  })
  @Delete(':id')
  release(@Param('id', { schema: z.uuid() }) quarantineId: string) {
    return this.stockQuarantineService.release(quarantineId);
  }
}
