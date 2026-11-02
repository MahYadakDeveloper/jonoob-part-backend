import { CheckPolicies } from '@feature/authorization-http/decorators';
import { PoliciesGuard } from '@feature/authorization-http/guards';
import { Controller, UseGuards } from '@nestjs/common';

import { ProcurementCommand } from './commands/procurement.cmd';
import { ProcurementAbilityFactory } from './policy/procurement.ability-factory';
import { ProcurementManagementPolicy } from './policy/procurement-management.policy';

/**
 * Sample controller. Reference only, do not uncomment as is; copy what you need, adapt it, and delete the rest.
 *
 * Rules this sample follows:
 *
 * - Thin controller: parse input, call ONE command or query, return its result. No business logic and no try/catch; the
 *   error filter translates domain errors.
 * - Auth is explicit on every handler: @RequiredAuth(), @OptionalAuth() or
 *
 * @example
 *   ```ts
 *   import {
 *     type AuthenticatedUser,
 *     type UserOf,
 *   } from '@feature/authentication-http';
 *   import {
 *     CurrentUser,
 *     OptionalAuth,
 *     Public,
 *     RequiredAuth,
 *   } from '@feature/authentication-http/decorators';
 *   import { ProblemResponses } from '@feature/error-http/decorators';
 *   import {
 *     ProcurementDuplicateError,
 *     ProcurementInvalidStateError,
 *     ProcurementNotFoundError,
 *     NotAllowedToProcurementError,
 *   } from '@feature/procurement-errors/procurement.errors';
 *   import {
 *     Body,
 *     Delete,
 *     Get,
 *     HttpCode,
 *     HttpStatus,
 *     Param,
 *     ParseUUIDPipe,
 *     Patch,
 *     Post,
 *     Put,
 *     Query,
 *   } from '@nestjs/common';
 *
 *   import { ArchiveProcurementCommand } from './commands/archive-procurement.cmd';
 *   import { CreateProcurementCommand } from './commands/create-procurement.cmd';
 *   import { DeleteProcurementCommand } from './commands/delete-procurement.cmd';
 *   import { ReplaceProcurementCommand } from './commands/replace-procurement.cmd';
 *   import { UpdateProcurementCommand } from './commands/update-procurement.cmd';
 *   import {
 *     type CreateProcurementDto,
 *     createProcurementDtoSchema,
 *   } from './dto/create-procurement.dto';
 *   import {
 *     type ListProcurementQueryDto,
 *     listProcurementQuerySchema,
 *   } from './dto/list-procurement-query.dto';
 *   import {
 *     type ReplaceProcurementDto,
 *     replaceProcurementDtoSchema,
 *   } from './dto/replace-procurement.dto';
 *   import {
 *     type UpdateProcurementDto,
 *     updateProcurementDtoSchema,
 *   } from './dto/update-procurement.dto';
 *   import { GetProcurementQuery } from './queries/get-procurement.query';
 *   import { ListProcurementQuery } from './queries/list-procurement.query';
 *
 *   // constructor: one dependency per use case
 *   constructor(
 *     private readonly listQuery: ListProcurementQuery,
 *     private readonly getQuery: GetProcurementQuery,
 *     private readonly createCmd: CreateProcurementCommand,
 *     private readonly replaceCmd: ReplaceProcurementCommand,
 *     private readonly updateCmd: UpdateProcurementCommand,
 *     private readonly deleteCmd: DeleteProcurementCommand,
 *     private readonly archiveCmd: ArchiveProcurementCommand,
 *   ) {}
 *
 *   // GET /procurement?page=1  (collection, authenticated)
 *   @RequiredAuth()
 *   @ProblemResponses(NotAllowedToProcurementError)
 *   @Get()
 *   list(@Query({ schema: listProcurementQuerySchema }) q: ListProcurementQueryDto) {
 *     return this.listQuery.execute(q);
 *   }
 *
 *   // GET /procurement/featured  (static path, declared BEFORE ':id'; no login needed)
 *   @Public()
 *   @Get('featured')
 *   featured() {
 *     return this.listQuery.execute({ featured: true });
 *   }
 *
 *   // GET /procurement/:id  (login optional: user is undefined for guests)
 *   @OptionalAuth()
 *   @ProblemResponses(ProcurementNotFoundError)
 *   @Get(':id')
 *   findOne(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @CurrentUser() user?: AuthenticatedUser,
 *   ) {
 *     return this.getQuery.execute({ id, viewer: user });
 *   }
 *
 *   // GET /procurement/:id/items  (sub-resource: the id comes first, then the name)
 *   @RequiredAuth()
 *   @ProblemResponses(ProcurementNotFoundError)
 *   @Get(':id/items')
 *   listItems(@Param('id', ParseUUIDPipe) id: string) {
 *     return this.getQuery.execute({ id, include: 'items' });
 *   }
 *
 *   // POST /procurement  (create, 201)
 *   @RequiredAuth()
 *   @ProblemResponses(ProcurementDuplicateError, NotAllowedToProcurementError)
 *   @Post()
 *   create(
 *     @Body({ schema: createProcurementDtoSchema }) dto: CreateProcurementDto,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.createCmd.execute({ ...dto, managerId: user.id });
 *   }
 *
 *   // PUT /procurement/:id  (full replace: the body is the complete representation)
 *   @RequiredAuth()
 *   @ProblemResponses(ProcurementNotFoundError, ProcurementDuplicateError)
 *   @Put(':id')
 *   replace(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @Body({ schema: replaceProcurementDtoSchema }) dto: ReplaceProcurementDto,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.replaceCmd.execute({ ...dto, id, managerId: user.id });
 *   }
 *
 *   // PATCH /procurement/:id  (partial update: only the sent fields change)
 *   @RequiredAuth()
 *   @ProblemResponses(ProcurementNotFoundError, ProcurementInvalidStateError)
 *   @Patch(':id')
 *   update(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @Body({ schema: updateProcurementDtoSchema }) dto: UpdateProcurementDto,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.updateCmd.execute({ ...dto, id, managerId: user.id });
 *   }
 *
 *   // POST /procurement/:id/archive  (state transition as an action, not a PATCH)
 *   @RequiredAuth()
 *   @ProblemResponses(ProcurementNotFoundError, ProcurementInvalidStateError)
 *   @HttpCode(HttpStatus.OK)
 *   @Post(':id/archive')
 *   archive(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.archiveCmd.execute({ id, managerId: user.id });
 *   }
 *
 *   // DELETE /procurement/:id  (204, empty body)
 *   @RequiredAuth()
 *   @ProblemResponses(ProcurementNotFoundError, ProcurementInvalidStateError)
 *   @HttpCode(HttpStatus.NO_CONTENT)
 *   @Delete(':id')
 *   async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
 *     await this.deleteCmd.execute({ id });
 *   }
 *   ```;
 *
 * @Public(). Never leave a route without one.
 * - Authorization is the class-level PoliciesGuard + @CheckPolicies below.
 * - Type @CurrentUser() with UserOf<'role'> when the handler is meant for one
 *   role, so role-specific fields are available (admin has no id). Use
 *   AuthenticatedUser only when the handler serves several roles, and narrow on
 *   user.role before reading role-specific fields. Note that @CurrentUser() does
 *   not enforce the role: the policy must.
 * - @ProblemResponses(...) lists the domain errors a handler can produce. It
 *   documents them in swagger and ties them to the error translation.
 *   Category errors (NotFound, Conflict, Forbidden, BusinessRuleViolation) are
 *   mapped to HTTP statuses automatically. An error that extends DomainError
 *   directly is NOT: it must also be registered in PROCUREMENT_ERROR_MAPPINGS
 *   (@feature/procurement-errors), otherwise it surfaces as 500.
 * - Only list errors the handler really throws, the same ones documented on
 *   the api contract and the command.
 * - Input is validated at the boundary: zod schema for @Body and @Query,
 *   ParseUUIDPipe for ids (use ParseIntPipe if ids are numeric).
 * - Route order matters: static paths ('featured') before param paths (':id').
 * - Status codes: POST create 201 (Nest default), PUT/PATCH 200, DELETE 204,
 *   actions on a resource are POST ':id/<verb>'.
 * - Never return raw DB rows from a handler; the command or query decides the
 *   shape of the response.
 *
 * Sample files this assumes (create them next to this controller): dto files
 * (create, replace, update, list query), a commands folder and a queries folder.
 */
@UseGuards(PoliciesGuard)
@CheckPolicies({
  abilityFactory: ProcurementAbilityFactory,
  handlers: [ProcurementManagementPolicy],
})
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementCmd: ProcurementCommand) {}

  // TODO
}
