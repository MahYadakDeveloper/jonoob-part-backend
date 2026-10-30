import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { minutes, Throttle } from '@nestjs/throttler';
import { AuthenticationCommand } from './commands/authentication.cmd';

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
 *     AuthenticationDuplicateError,
 *     AuthenticationInvalidStateError,
 *     AuthenticationNotFoundError,
 *     NotAllowedToAuthenticationError,
 *   } from '@feature/authentication-errors/authentication.errors';
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
 *   import { ArchiveAuthenticationCommand } from './commands/archive-authentication.cmd';
 *   import { CreateAuthenticationCommand } from './commands/create-authentication.cmd';
 *   import { DeleteAuthenticationCommand } from './commands/delete-authentication.cmd';
 *   import { ReplaceAuthenticationCommand } from './commands/replace-authentication.cmd';
 *   import { UpdateAuthenticationCommand } from './commands/update-authentication.cmd';
 *   import {
 *     type CreateAuthenticationDto,
 *     createAuthenticationDtoSchema,
 *   } from './dto/create-authentication.dto';
 *   import {
 *     type ListAuthenticationQueryDto,
 *     listAuthenticationQuerySchema,
 *   } from './dto/list-authentication-query.dto';
 *   import {
 *     type ReplaceAuthenticationDto,
 *     replaceAuthenticationDtoSchema,
 *   } from './dto/replace-authentication.dto';
 *   import {
 *     type UpdateAuthenticationDto,
 *     updateAuthenticationDtoSchema,
 *   } from './dto/update-authentication.dto';
 *   import { GetAuthenticationQuery } from './queries/get-authentication.query';
 *   import { ListAuthenticationQuery } from './queries/list-authentication.query';
 *
 *   // constructor: one dependency per use case
 *   constructor(
 *     private readonly listQuery: ListAuthenticationQuery,
 *     private readonly getQuery: GetAuthenticationQuery,
 *     private readonly createCmd: CreateAuthenticationCommand,
 *     private readonly replaceCmd: ReplaceAuthenticationCommand,
 *     private readonly updateCmd: UpdateAuthenticationCommand,
 *     private readonly deleteCmd: DeleteAuthenticationCommand,
 *     private readonly archiveCmd: ArchiveAuthenticationCommand,
 *   ) {}
 *
 *   // GET /authentication?page=1  (collection, authenticated)
 *   @RequiredAuth()
 *   @ProblemResponses(NotAllowedToAuthenticationError)
 *   @Get()
 *   list(@Query({ schema: listAuthenticationQuerySchema }) q: ListAuthenticationQueryDto) {
 *     return this.listQuery.execute(q);
 *   }
 *
 *   // GET /authentication/featured  (static path, declared BEFORE ':id'; no login needed)
 *   @Public()
 *   @Get('featured')
 *   featured() {
 *     return this.listQuery.execute({ featured: true });
 *   }
 *
 *   // GET /authentication/:id  (login optional: user is undefined for guests)
 *   @OptionalAuth()
 *   @ProblemResponses(AuthenticationNotFoundError)
 *   @Get(':id')
 *   findOne(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @CurrentUser() user?: AuthenticatedUser,
 *   ) {
 *     return this.getQuery.execute({ id, viewer: user });
 *   }
 *
 *   // GET /authentication/:id/items  (sub-resource: the id comes first, then the name)
 *   @RequiredAuth()
 *   @ProblemResponses(AuthenticationNotFoundError)
 *   @Get(':id/items')
 *   listItems(@Param('id', ParseUUIDPipe) id: string) {
 *     return this.getQuery.execute({ id, include: 'items' });
 *   }
 *
 *   // POST /authentication  (create, 201)
 *   @RequiredAuth()
 *   @ProblemResponses(AuthenticationDuplicateError, NotAllowedToAuthenticationError)
 *   @Post()
 *   create(
 *     @Body({ schema: createAuthenticationDtoSchema }) dto: CreateAuthenticationDto,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.createCmd.execute({ ...dto, managerId: user.id });
 *   }
 *
 *   // PUT /authentication/:id  (full replace: the body is the complete representation)
 *   @RequiredAuth()
 *   @ProblemResponses(AuthenticationNotFoundError, AuthenticationDuplicateError)
 *   @Put(':id')
 *   replace(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @Body({ schema: replaceAuthenticationDtoSchema }) dto: ReplaceAuthenticationDto,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.replaceCmd.execute({ ...dto, id, managerId: user.id });
 *   }
 *
 *   // PATCH /authentication/:id  (partial update: only the sent fields change)
 *   @RequiredAuth()
 *   @ProblemResponses(AuthenticationNotFoundError, AuthenticationInvalidStateError)
 *   @Patch(':id')
 *   update(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @Body({ schema: updateAuthenticationDtoSchema }) dto: UpdateAuthenticationDto,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.updateCmd.execute({ ...dto, id, managerId: user.id });
 *   }
 *
 *   // POST /authentication/:id/archive  (state transition as an action, not a PATCH)
 *   @RequiredAuth()
 *   @ProblemResponses(AuthenticationNotFoundError, AuthenticationInvalidStateError)
 *   @HttpCode(HttpStatus.OK)
 *   @Post(':id/archive')
 *   archive(
 *     @Param('id', ParseUUIDPipe) id: string,
 *     @CurrentUser() user: UserOf<'manager'>,
 *   ) {
 *     return this.archiveCmd.execute({ id, managerId: user.id });
 *   }
 *
 *   // DELETE /authentication/:id  (204, empty body)
 *   @RequiredAuth()
 *   @ProblemResponses(AuthenticationNotFoundError, AuthenticationInvalidStateError)
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
 *   directly is NOT: it must also be registered in AUTHENTICATION_ERROR_MAPPINGS
 *   (@feature/authentication-errors), otherwise it surfaces as 500.
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

@Public()
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationCmd: AuthenticationCommand) {}

  // ---------- OTP ----------

  @Throttle({
    auth: { limit: 3, ttl: minutes(10), blockDuration: minutes(10) },
  })
  @Post('otp/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestOtp(
    @Body({ schema: requestOtpSchema }) dto: RequestOtpDto,
  ): Name {
    await this.auth.request(dto.phone);
  }

  /** Useful for password sign-in */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.auth.verify({
      // phoneNumber: dto.phoneNumber,
      // TODO Use token instead, when otp is requested return token for verify
      otp: dto.otp,
      ip,
    });
  }

  // ---------- Customer ----------

  @Post('customer/sign-in')
  @HttpCode(HttpStatus.OK)
  @HttpCode(HttpStatus.OK)
  async signInCustomer(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.auth.signInCustomer(dto);
  }

  // ---------- Staff ----------

  @Post('courier/sign-in')
  @HttpCode(HttpStatus.OK)
  singInCourier(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.auth.signInCourier(dto);
  }

  @Post('manager/sign-in')
  @HttpCode(HttpStatus.OK)
  signInManager(
    @Body({ schema: passwordSignInSchema }) dto: PasswordSignInDto,
  ) {
    return this.auth.managerSignIn({
      verifyToken: dto.verifyToken,
      password: dto.password,
    });
  }

  @Post('admin/sign-in')
  @HttpCode(HttpStatus.OK)
  signInAdmin(@Body({ schema: adminSignInSchema }) dto: AdminSignInDto) {
    return this.auth.signInAdmin({
      verifyToken: dto.verifyToken,
      secretKey: dto.secretKey,
    });
  }

  // ---------- Tokens ----------

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body({ schema: refreshSchema }) dto: RefreshDto) {
    return this.auth.refresh({ oldRefreshToken: dto.refreshToken });
  }
}
