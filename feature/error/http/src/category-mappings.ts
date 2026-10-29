import { HttpStatus } from '@nestjs/common';
import { errorsWithKeys, mapDomainError } from './domain-error-mapping';
import {
  BusinessRuleViolationError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@feature/shared/errors';

export const CATEGORY_ERROR_MAPPINGS = errorsWithKeys({
  NotFoundError: mapDomainError(
    NotFoundError,
    HttpStatus.NOT_FOUND,
    'Resource not found',
  ),
  ConflictError: mapDomainError(
    ConflictError,
    HttpStatus.CONFLICT,
    'Conflict with current state',
  ),
  BusinessRuleViolationError: mapDomainError(
    BusinessRuleViolationError,
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Business rule violated',
  ),
  ForbiddenError: mapDomainError(
    ForbiddenError,
    HttpStatus.FORBIDDEN,
    'Operation not allowed',
  ),
});
