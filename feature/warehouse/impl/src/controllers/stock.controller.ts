import { StockMovementService } from '../services/movement.service';
import { StockService } from '../services/stock.service';
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
import {
  type StockAdjustment,
  stockAdjustmentSchema,
  type StockDefinition,
  stockDefinitionSchema,
  type StockPageQuery,
  stockPageQuerySchema,
} from './schema/stock.schemas';

@Controller('warehouse/stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  @Get(':id')
  stock(@Param('id', { schema: z.uuid() }) stockId: string) {
    return this.stockService.findById(stockId);
  }

  @Get()
  page(@Query({ schema: stockPageQuerySchema }) criteria: StockPageQuery) {
    return this.stockService.page(criteria);
  }

  @Post()
  define(@Body({ schema: stockDefinitionSchema }) definition: StockDefinition) {
    return this.stockService.define(definition);
  }

  @Patch(':id')
  adjust(
    @Param({ schema: z.uuid() }) stockId: string,
    @Body({ schema: stockAdjustmentSchema })
    { quantity, ...rest }: StockAdjustment,
  ) {
    this.stockMovementService.adjust({ ...rest, item: { stockId, quantity } });
  }

  @Put(':id')
  redefine(
    @Param('id', { schema: z.uuid() }) stockId: string,
    @Body({ schema: stockDefinitionSchema }) definition: StockDefinition,
  ) {
    return this.stockService.redefine(stockId, definition);
  }

  @Delete(':id')
  delete(@Param('id', { schema: z.uuid() }) stockId: string) {
    return this.stockService.delete(stockId);
  }
}
