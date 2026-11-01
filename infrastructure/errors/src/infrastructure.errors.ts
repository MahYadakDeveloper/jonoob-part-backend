export type InfrastructureErrorKind =
  | 'UNAVAILABLE'
  | 'TIMEOUT'
  | 'UPSTREAM_FAILED'
  | 'UPSTREAM_RATE_LIMITED';

export interface InfrastructureErrorOptions {
  cause?: unknown;
  retryAfterSeconds?: number;
}

export abstract class InfrastructureError extends Error {
  abstract readonly kind: InfrastructureErrorKind;
  abstract readonly code: string;
  readonly retryAfterSeconds?: number;

  protected constructor(
    message: string,
    readonly service: string,
    options: InfrastructureErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export class DependencyUnavailableError extends InfrastructureError {
  readonly kind = 'UNAVAILABLE';
  readonly code = 'DEPENDENCY_UNAVAILABLE';

  constructor(service: string, options?: InfrastructureErrorOptions) {
    super(`${service} is unavailable`, service, options);
  }
}

export class DependencyTimeoutError extends InfrastructureError {
  readonly kind = 'TIMEOUT';
  readonly code = 'DEPENDENCY_TIMEOUT';

  constructor(service: string, options?: InfrastructureErrorOptions) {
    super(`${service} timed out`, service, options);
  }
}

export class ExternalServiceError extends InfrastructureError {
  readonly kind = 'UPSTREAM_FAILED';
  readonly code = 'EXTERNAL_SERVICE_FAILED';

  constructor(service: string, options?: InfrastructureErrorOptions) {
    super(`${service} request failed`, service, options);
  }
}

export class ExternalServiceRateLimitedError extends InfrastructureError {
  readonly kind = 'UPSTREAM_RATE_LIMITED';
  readonly code = 'EXTERNAL_SERVICE_RATE_LIMITED';

  constructor(service: string, options?: InfrastructureErrorOptions) {
    super(`${service} rate limited the request`, service, options);
  }
}
