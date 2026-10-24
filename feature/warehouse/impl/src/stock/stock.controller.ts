import { CheckPolicies } from '@feature/shared/decorators/check-policies.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { StockMovementService } from '../movement/movement.service';
import { StockManagementPolicyHandler } from './policies/manage-stock.policy-handler';
import { StockAbilityFactory } from './policies/stock-ability';
import {
  type StockAdjustmentDto,
  StockAdjustmentSchema,
  type StockDefinitionDto,
  StockDefinitionSchema,
  type StockPageQueryDto,
  StockPageQuerySchema,
} from './stock.dto';
import { StockService } from './stock.service';

// @UseGuards(AuthGuard, PoliciesGuard)
@Controller('warehouse/stock')
export class StockController {
  constructor(
    private readonly stocks: StockService,
    private readonly movements: StockMovementService,
  ) {}

  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Get(':id')
  stock(@Param('id', { schema: z.uuid() }) stockId: string) {
    return this.stocks.getById(stockId);
  }

  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Get()
  page(@Query({ schema: StockPageQuerySchema }) criteria: StockPageQueryDto) {
    return this.stocks.page(criteria);
  }

  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Post()
  define(
    @Body({ schema: StockDefinitionSchema }) definition: StockDefinitionDto,
  ) {
    return this.stocks.define(definition);
  }

  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Put(':id')
  redefine(
    @Param('id', { schema: z.uuid() }) stockId: string,
    @Body({ schema: StockDefinitionSchema }) definition: StockDefinitionDto,
  ) {
    return this.stocks.redefine(stockId, definition);
  }

  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Delete(':id')
  delete(@Param('id', { schema: z.uuid() }) stockId: string) {
    return this.stocks.delete(stockId);
  }
}
