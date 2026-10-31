import { errorsWithKeys, mapDomainError } from '@feature/error-http';
import { DomainError } from '@feature/shared/errors';
import { HttpStatus } from '@nestjs/common';

export class OtpTooManyAttemptsError extends DomainError {
  constructor() {
    super('Too many invalid OTP attempts');
  }
}

export class OtpExpiredError extends DomainError {
  constructor() {
    super('OTP expired');
  }
}

export class OtpInvalidError extends DomainError {
  constructor() {
    super('OTP is not valid');
  }
}

export const AUTH_ERROR_MAPPINGS = errorsWithKeys({
  OtpTooManyAttemptsError: mapDomainError(
    OtpTooManyAttemptsError,
    HttpStatus.TOO_MANY_REQUESTS,
    'Too many invalid OTP attempts',
  ),
  OtpExpiredError: mapDomainError(
    OtpExpiredError,
    HttpStatus.GONE,
    'OTP expired',
  ),
  OtpInvalidError: mapDomainError(
    OtpInvalidError,
    HttpStatus.BAD_REQUEST,
    'Invalid OTP',
  ),
});
