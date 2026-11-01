import { CheckPolicies } from '@feature/authorization-http/decorators';
import { PoliciesGuard } from '@feature/authorization-http/guards';
import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { RequiredAuth } from '@feature/authentication-http/decorators';
import { RegistrationCommand } from './commands/register-manager.cmd';
import { RegistrationManagementPolicy } from './policy/registration-management.policy';
import { RegistrationAbilityFactory } from './policy/registration.ability-factory';

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
 *     RegistrationDuplicateError,
 *     RegistrationInvalidStateError,
 *     RegistrationNotFoundError,
 *     NotAllowedToRegistrationError,
 *   } from '@feature/registration-errors/registration.errors';
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
 *   import { ArchiveRegistrationCommand } from './commands/archive-registration.cmd';
 *   import { CreateRegistrationCommand } from './commands/create-registration.cmd';
 *   import { DeleteRegistrationCommand } from './commands/delete-registration.cmd';
 *   import { ReplaceRegistrationCommand } from './commands/replace-registration.cmd';
 *   import { UpdateRegistrationCommand } from './commands/update-registration.cmd';
 *   import {
 *     type CreateRegistrationDto,
 *     createRegistrationDtoSchema,
 *   } from './dto/create-registration.dto';
 *   import {
 *     type ListRegistrationQueryDto,
 *     listRegistrationQuerySchema,
 *   } from './dto/list-registration-query.dto';
 *   import {
 *     type ReplaceRegistrationDto,
 *     replaceRegistrationDtoSchema,
 *   } from './dto/replace-registration.dto';
 *   import {
 *     type UpdateRegistrationDto,
 *     updateRegistrationDtoSchema,
 *   } from './dto/update-registration.dto';
 *   import { GetRegistrationQuery } from './queries/get-registration.query';
 *   import { ListRegistrationQuery } from './queries/list-registration.query';
 *
 *   // constructor: one dependency per use case
 *   constructor(
 *     private readonly listQuery: ListRegistrationQuery,
 *     private readonly getQuery: GetRegistrationQuery,
 *     private readonly createCmd: CreateRegistrationCommand,
 *     private readonly replaceCmd: ReplaceRegistrationCommand,
 *     private readonly updateCmd: UpdateRegistrationCommand,
 *     private readonly deleteCmd: DeleteRegistrationCommand,
 *     private readonly archiveCmd: ArchiveRegistrationCommand,
 *   ) {}
 *
 *   // GET /authentication/registration?page=1  (collection, authenticated)
 *   @RequiredAuth()
 *   @ProblemResponses(NotAllowedToRegistrationError)
 *   @Get()
 *   list(@Query({ schema: listRegistrationQuerySchema }) q: ListRegistrationQueryDto) {
 *     return this.listQuery.execute(q);
 *   }
 *
 *   // GET /authentication/registration/featured  (static path, declared BEFORE ':id'; no login needed)
 *   @Public()
 *   @Get('featured')
 *   featured() {
 *     return this.listQuery.execute({ featured: true });
 *   }
 *
 *   // GET /authentication/registration/:id  (login optional: user is undefined for guests)
 *   @OptionalAuth()
 *   @ProblemResponses(RegistrationNotFoundError)
 *   @Get(':id')
 *   findOne(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @CurrentUser() user?: AuthenticatedUser,
 *   ) {
 *     return this.getQuery.execute({ id, viewer: user });
 *   }
 *
 *   // GET /authentication/registration/:id/items  (sub-resource: the id comes first, then the name)
 *   @RequiredAuth()
 *   @ProblemResponses(RegistrationNotFoundError)
 *   @Get(':id/items')
 *   listItems(@Param('id', ParseUUIDPipe) id: string) {
 *     return this.getQuery.execute({ id, include: 'items' });
 *   }
 *
 *   // POST /authentication/registration  (create, 201)
 *   @RequiredAuth()
 *   @ProblemResponses(RegistrationDuplicateError, NotAllowedToRegistrationError)
 *   @Post()
 *   create(
 *     @Body({ schema: createRegistrationDtoSchema }) dto: CreateRegistrationDto,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.createCmd.execute({ ...dto, managerId: user.id });
 *   }
 *
 *   // PUT /authentication/registration/:id  (full replace: the body is the complete representation)
 *   @RequiredAuth()
 *   @ProblemResponses(RegistrationNotFoundError, RegistrationDuplicateError)
 *   @Put(':id')
 *   replace(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @Body({ schema: replaceRegistrationDtoSchema }) dto: ReplaceRegistrationDto,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.replaceCmd.execute({ ...dto, id, managerId: user.id });
 *   }
 *
 *   // PATCH /authentication/registration/:id  (partial update: only the sent fields change)
 *   @RequiredAuth()
 *   @ProblemResponses(RegistrationNotFoundError, RegistrationInvalidStateError)
 *   @Patch(':id')
 *   update(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @Body({ schema: updateRegistrationDtoSchema }) dto: UpdateRegistrationDto,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.updateCmd.execute({ ...dto, id, managerId: user.id });
 *   }
 *
 *   // POST /authentication/registration/:id/archive  (state transition as an action, not a PATCH)
 *   @RequiredAuth()
 *   @ProblemResponses(RegistrationNotFoundError, RegistrationInvalidStateError)
 *   @HttpCode(HttpStatus.OK)
 *   @Post(':id/archive')
 *   archive(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.archiveCmd.execute({ id, managerId: user.id });
 *   }
 *
 *   // DELETE /authentication/registration/:id  (204, empty body)
 *   @RequiredAuth()
 *   @ProblemResponses(RegistrationNotFoundError, RegistrationInvalidStateError)
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
 *   directly is NOT: it must also be registered in REGISTRATION_ERROR_MAPPINGS
 *   (@feature/registration-errors), otherwise it surfaces as 500.
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
  abilityFactory: RegistrationAbilityFactory,
  handlers: [RegistrationManagementPolicy],
})
@Controller('authentication/registration')
export class RegistrationController {
  constructor(private readonly registrationCmd: RegistrationCommand) {}

  @RequiredAuth()
  @UseGuards(PoliciesGuard)
  @CheckPolicies({
    abilityFactory: UsersAbilityFactory,
    handlers: [UsersRegistrationPolicy],
  })
  @Post('managers/register')
  @HttpCode(HttpStatus.CREATED)
  registerManager() {}

  @RequiredAuth()
  @UseGuards(PoliciesGuard)
  @CheckPolicies({
    abilityFactory: UsersAbilityFactory,
    handlers: [UsersRegistrationPolicy],
  })
  @Post('managers/:id/unregister')
  @HttpCode(HttpStatus.OK)
  unregisterManager() {}

  @RequiredAuth()
  @UseGuards(PoliciesGuard)
  @CheckPolicies({
    abilityFactory: UsersAbilityFactory,
    handlers: [UsersRegistrationPolicy],
  })
  @Post('couriers/register')
  @HttpCode(HttpStatus.OK)
  registerCourier() {}

  @RequiredAuth()
  @UseGuards(PoliciesGuard)
  @CheckPolicies({
    abilityFactory: UsersAbilityFactory,
    handlers: [UsersRegistrationPolicy],
  })
  @Post('couriers/:id/unregister')
  @HttpCode(HttpStatus.OK)
  unregisterCourier() {}
}
