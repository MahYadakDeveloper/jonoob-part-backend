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

type AuthTokenInvalidReason = 'expired' | 'invalid' | 'revoked';
export class AuthTokenInvalidError extends DomainError {
  constructor(readonly reason: AuthTokenInvalidReason) {
    super(`Auth token is ${reason}`);
  }
}

export class AuthInvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid credentials');
  }
}

export const OTP_ERROR_MAPPINGS = errorsWithKeys({
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
export const AUTH_ERROR_MAPPINGS = errorsWithKeys({
  AuthTokenInvalidError: mapDomainError(
    AuthTokenInvalidError,
    HttpStatus.UNAUTHORIZED,
    'Invalid or expired token',
    (e) => ({ reason: e.reason }),
  ),
  AuthInvalidCredentialsError: mapDomainError(
    AuthInvalidCredentialsError,
    HttpStatus.UNAUTHORIZED,
    'Invalid credentials',
  ),
});
