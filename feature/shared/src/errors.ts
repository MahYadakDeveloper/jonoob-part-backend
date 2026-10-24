import { ConflictException } from '@nestjs/common';

export class IdempotencyConflictException extends ConflictException {
  constructor(key: string) {
    super(`Idempotency key "${key}" was already used with a different payload`);
  }
}
