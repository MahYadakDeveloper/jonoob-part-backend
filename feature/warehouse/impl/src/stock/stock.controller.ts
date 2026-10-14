import { CheckPolicies } from '@feature/shared/decorators/check-policies.decorator';
import { AuthenticationGuard } from '@feature/shared/guards/auth.guard';
import { PoliciesGuard } from '@feature/shared/guards/policies.guard';
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
  UseGuards,
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

@UseGuards(AuthenticationGuard, PoliciesGuard)
@Controller('warehouse/stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Get(':id')
  stock(@Param('id', { schema: z.uuid() }) stockId: string) {
    return this.stockService.findById(stockId);
  }

  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Get()
  page(@Query({ schema: StockPageQuerySchema }) criteria: StockPageQueryDto) {
    return this.stockService.page(criteria);
  }

  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Post()
  define(
    @Body({ schema: StockDefinitionSchema }) definition: StockDefinitionDto,
  ) {
    return this.stockService.define(definition);
  }

  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Patch(':id')
  adjust(
    @Param({ schema: z.uuid() }) stockId: string,
    @Body({ schema: StockAdjustmentSchema })
    { quantity, ...rest }: StockAdjustmentDto,
  ) {
    this.stockMovementService.adjust({ ...rest, item: { stockId, quantity } });
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
    return this.stockService.redefine(stockId, definition);
  }

  @CheckPolicies({
    abilityFactory: StockAbilityFactory,
    handlers: [StockManagementPolicyHandler],
  })
  @Delete(':id')
  delete(@Param('id', { schema: z.uuid() }) stockId: string) {
    return this.stockService.delete(stockId);
  }
}
