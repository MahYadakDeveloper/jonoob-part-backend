import { HttpStatus } from '@nestjs/common';
import { mapDomainError } from './domain-error-mapping';
import {
  BusinessRuleViolationError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@feature/shared/errors';

export const CATEGORY_ERROR_MAPPINGS = [
  mapDomainError(NotFoundError, HttpStatus.NOT_FOUND, 'Resource not found'),
  mapDomainError(
    ConflictError,
    HttpStatus.CONFLICT,
    'Conflict with current state',
  ),
  mapDomainError(
    BusinessRuleViolationError,
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Business rule violated',
  ),
  mapDomainError(ForbiddenError, HttpStatus.FORBIDDEN, 'Operation not allowed'),
];
