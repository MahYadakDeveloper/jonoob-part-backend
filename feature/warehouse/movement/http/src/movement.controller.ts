import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import {
  ListQuery,
  listQuerySchema,
  type ListQueryDto,
} from './queries/list.query';

@Controller('warehouse/movement')
export class MovementController {
  constructor(private readonly listQuery: ListQuery) {}

  @Get()
  list(@Query({ schema: listQuerySchema }) q: ListQueryDto) {
    return this.listQuery.execute(q);
  }

  @Post(':id')
  adjust(@Param('id', { schema: z.uuid() }) id: string) {
    return this.commands.adjust();
  }
}
