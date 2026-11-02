import { PoliciesGuard } from '@feature/authorization-http/guards';
import { CheckPolicies } from '@feature/shared/decorators/check-policies.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { StockManagementPolicyHandler } from './policies/manage-stock.policy-handler';
import { StockAbilityFactory } from './policies/stock-ability';
import { type BarcodeQuery, barcodeQuerySchema } from './stocks.dto';

@UseGuards(PoliciesGuard)
@CheckPolicies({
  abilityFactory: StockAbilityFactory,
  handlers: [StockManagementPolicyHandler],
})
@Controller('warehouse/stock')
export class StockController {
  constructor(
  ) {}

  @Get(':id')
  getById(@Param('id', { schema: z.uuid() }) stockId: string) {
    return this.stocks.getById(stockId);
  }

  @Get()
  getByBarcode(@Query({ schema: barcodeQuerySchema }) q: BarcodeQuery) {}

  @Post()
  declare(
    @Body({ schema: }) dto: ,
  ) {
    return this.stocks.define(definition);
  }

  @Put(':id')
  redeclare(
    @Param('id', { schema: z.uuid() }) stockId: string,
    @Body({ schema: StockDefinitionSchema }) definition: StockDefinitionDto,
  ) {
    return this.stocks.redefine(stockId, definition);
  }

  @Delete(':id')
  remove(@Param('id', { schema: z.uuid() }) stockId: string) {
    return this.stocks.delete(stockId);
  }
}
