import { DomainError, httpError } from '@feature/shared/errors';
import { HttpStatus } from '@nestjs/common';

export class MovementNotFoundError extends DomainError {}
export class MovementFailure extends DomainError {}

export const movementHttpErrors = [
  httpError(
    MovementNotFoundError,
    HttpStatus.NOT_FOUND,
    'رکورد جابجایی پیدا نشد',
  ),
  httpError(MovementFailure, HttpStatus.CONFLICT, 'جابجایی کالا انجام نشد'),
];
