import { ConflictException } from '@nestjs/common';

/** Base for domain errors; `name` is the concrete class name. */
export abstract class DomainError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** A value could not be parsed by the database (e.g. an invalid id). */
export abstract class MalformedInputError extends DomainError {
  constructor(message = 'Malformed input value', options?: ErrorOptions) {
    super(message, options);
  }
}

export class IdempotencyConflictException extends ConflictException {
  constructor(key: string) {
    super(`Idempotency key "${key}" was already used with a different payload`);
  }
}
