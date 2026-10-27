import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import {
  ListQuery,
  listQuerySchema,
  type ListQueryDto,
} from './queries/list.query';
import { PoliciesGuard } from '@feature/authorization-http/guards';
import { CheckPolicies } from '@feature/authorization-http/decorators';
import { CurrentUser, Public } from '@feature/authentication-http/decorators';
import { type AuthenticatedUser } from '@feature/authentication-http';
import { RequiredAuth } from '@feature/authentication-http/decorators';

@UseGuards(PoliciesGuard)
@Controller('warehouse/movement')
export class MovementController {
  constructor(private readonly listQuery: ListQuery) {}

  @Public()
  @Get()
  list(@Query({ schema: listQuerySchema }) q: ListQueryDto) {
    return this.listQuery.execute(q);
  }

  @RequiredAuth()
  @CheckPolicies()
  @Post(':id')
  adjust(
    @Param('id', { schema: z.uuid() }) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commands.adjust();
  }
}
