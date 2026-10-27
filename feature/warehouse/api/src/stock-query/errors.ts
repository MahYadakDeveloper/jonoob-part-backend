import {
  MalformedInputError as BaseMalformedInputError,
  DomainError,
} from '@feature/shared/errors';

class StockError extends DomainError {}

export class MalformedInputError extends BaseMalformedInputError {}
