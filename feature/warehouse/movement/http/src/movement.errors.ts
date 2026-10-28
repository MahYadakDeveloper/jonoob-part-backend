import { httpError, RecordNotFoundError } from '@feature/shared/errors';
import {
  MovementFailure,
  MovementNotFoundError,
} from '@feature/warehouse-errors/movement';
import { HttpStatus } from '@nestjs/common';

export class StockNotFoundError extends RecordNotFoundError {}

export const movementHttpErrors = [
  httpError(MovementNotFoundError, HttpStatus.NOT_FOUND, 'Movement not found'),
  httpError(MovementFailure, HttpStatus.CONFLICT, 'Movement failed'),
];
