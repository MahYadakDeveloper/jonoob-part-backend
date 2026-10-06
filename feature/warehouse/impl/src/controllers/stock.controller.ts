import { StockService } from '@/services/stock.service';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import {
  type StockDefinition,
  stockDefinitionSchema,
  type StockPageQuery,
  stockPageQuerySchema,
} from './schema/stock.schemas';

@Controller('warehouse/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get(':id')
  stock(@Param({ schema: z.uuid() }) id: string) {
    return this.stockService.findById(id);
  }

  @Get()
  page(@Query({ schema: stockPageQuerySchema }) criteria: StockPageQuery) {
    return this.stockService.page;
  }

  @Post()
  define(@Body({ schema: stockDefinitionSchema }) definition: StockDefinition) {
    return this.stockService.define(definition);
  }

  @Post(':id')
  redefine(
    @Param({ schema: z.uuid() }) id: string,
    @Body({ schema: stockDefinitionSchema }) definition: StockDefinition,
  ) {
    return this.stockService.redefine(id, definition);
  }
}
