import { errorsWithKeys } from '@feature/error-http';
import {
  BusinessRuleViolationError,
  ConflictError,
  DomainError,
  EntityNotFoundError,
  ForbiddenError,
} from '@feature/shared/errors';
import { HttpStatus } from '@nestjs/common';

/**
 * Naming domain errors:
 *
 * - Name the business condition, not the technical cause or HTTP status
 *   (InsufficientBalanceError, not BadRequestError or PgCheckViolationError).
 * - Format: <Subject><Condition>Error, e.g. MovementNotFoundError,
 *   WalletInsufficientBalanceError. Use "Failure" only for a generic operation
 *   failure with a reason param (MovementFailure).
 * - Past-tense or state words read best: NotFound, AlreadyExists, Expired,
 *   Insufficient, Invalid, Forbidden.
 * - The code mirrors the name: MovementNotFoundError -> MOVEMENT_NOT_FOUND.
 * - One class per distinct client behavior; reasons that only differ in detail
 *   go into params, not into new classes.
 */

// ------------------------------------------------------------------ 404
export class WarehouseNotFoundError extends EntityNotFoundError {
  // Optional: if not provided, the entity is read from the class name
  // (WarehouseNotFoundError -> 'Warehouse').
  // private override readonly entity = 'Warehouse';

  /**
   * constructor EntityNotFoundError(...) -- adapt the arguments to the base class.
   */
  constructor(id: string, options?: { cause?: unknown }) {
    super(`Warehouse "${id}" was not found`, options);
  }
}

// ------------------------------------------------------------------ 409
export class WarehouseDuplicateError extends ConflictError {
  /**
   * constructor ConflictError(message: string, options?: { cause?: unknown; }):
   * ConflictError
   */
  constructor(field: string, options?: { cause?: unknown }) {
    super(`Warehouse with the same ${field} already exists`, options);
  }
}

// ------------------------------------------------------------------ 403
export class NotAllowedToWarehouseError extends ForbiddenError {
  /**
   * constructor ForbiddenError(message: string, options?: { cause?: unknown;
   * }): ForbiddenError
   */
  constructor(action: string, options?: { cause?: unknown }) {
    super(`Not allowed to ${action} Warehouse`, options);
  }
}

// ------------------------------------------------------------------ 422
// Example for BusinessRuleViolationError (default mapping: 422).
export class WarehouseInvalidStateError extends BusinessRuleViolationError {
  /**
   * constructor BusinessRuleViolationError(message: string, options?: {
   *   cause?: unknown;
   * }): BusinessRuleViolationError
   */
  constructor(
    readonly currentState: string,
    readonly attemptedAction: string,
    options?: { cause?: unknown },
  ) {
    super(
      `Cannot ${attemptedAction} Warehouse while it is in state "${currentState}"`,
      options,
    );
  }
}

// ------------------------------------------------------------------ custom
// This has no default mapping: it must be registered in WAREHOUSE_ERROR_MAPPINGS.
export class WarehousePreconditionFailedError extends DomainError {
  /**
   * constructor DomainError(message: string, options?: {
   *   cause?: unknown;
   * }): DomainError
   */
  constructor(reason: string, options?: { cause?: unknown }) {
    super(`Warehouse precondition failed: ${reason}`, options);
  }
}

// ------------------------------------------------------------------ mapping
// Category errors (NotFound, Conflict, Forbidden, BusinessRuleViolation, ...)
// are mapped automatically by the default CATEGORY_ERROR_MAPPINGS of the
// http-error module, so no mapping is required when using one of them.
// Mapping is only needed for errors that extend DomainError directly.
// Below is an example of doing the mapping (adapt to the real errorsWithKeys signature):
export const WAREHOUSE_ERROR_MAPPINGS = errorsWithKeys({
  // WarehousePreconditionFailedError: [HttpStatus.PRECONDITION_FAILED, 'Precondition failed'],
});
void HttpStatus;

/**
 * ---------------------------------------------------------------------------
 * Client errors (4xx) reference: when to use, and examples.
 * Prefer the category base class when one fits; use DomainError + mapping
 * (above) only when the status has no category.
 * ---------------------------------------------------------------------------
 *
 * 400 Bad Request (HttpStatus.BAD_REQUEST)
 *   Malformed syntax or invalid shape; the request cannot be understood.
 *   Ex: invalid JSON body, wrong param type, failed DTO validation.
 *
 * 401 Unauthorized (HttpStatus.UNAUTHORIZED)
 *   Missing or invalid credentials.
 *   Ex: no token, expired token, wrong password.
 *
 * 403 Forbidden (HttpStatus.FORBIDDEN)  [ForbiddenError]
 *   Authenticated, but not allowed to perform the action.
 *   Ex: a courier trying to manage warehouse stock.
 *
 * 404 Not Found (HttpStatus.NOT_FOUND)  [EntityNotFoundError]
 *   The target resource does not exist (or is hidden from the caller).
 *   Ex: movement id that does not exist.
 *
 * 405 Method Not Allowed (HttpStatus.METHOD_NOT_ALLOWED)
 *   The resource exists but does not support this HTTP method.
 *   Ex: DELETE on a read-only resource.
 *
 * 406 Not Acceptable (HttpStatus.NOT_ACCEPTABLE)
 *   Cannot produce a representation matching the Accept headers.
 *   Ex: Accept: application/xml when only JSON is served.
 *
 * 408 Request Timeout (HttpStatus.REQUEST_TIMEOUT)
 *   The client took too long to send the full request.
 *   Ex: stalled upload.
 *
 * 409 Conflict (HttpStatus.CONFLICT)  [ConflictError]
 *   The request conflicts with the current state of the resource.
 *   Ex: duplicate unique key, optimistic-lock version mismatch.
 *
 * 410 Gone (HttpStatus.GONE)
 *   The resource existed but was permanently removed.
 *   Ex: expired one-time link, deleted and purged entity.
 *
 * 411 Length Required (HttpStatus.LENGTH_REQUIRED)
 *   Content-Length header is required but missing.
 *   Ex: upload endpoint that refuses chunked bodies.
 *
 * 412 Precondition Failed (HttpStatus.PRECONDITION_FAILED)
 *   A conditional header (If-Match, If-Unmodified-Since) evaluated to false.
 *   Ex: PUT with a stale ETag in If-Match.
 *
 * 413 Payload Too Large (HttpStatus.PAYLOAD_TOO_LARGE)
 *   The body exceeds the size limit.
 *   Ex: image upload bigger than the allowed maximum.
 *
 * 414 URI Too Long (HttpStatus.URI_TOO_LONG)
 *   The URL is longer than the server accepts.
 *   Ex: a GET filter with thousands of ids in the query string.
 *
 * 415 Unsupported Media Type (HttpStatus.UNSUPPORTED_MEDIA_TYPE)
 *   The Content-Type of the body is not supported.
 *   Ex: text/plain sent to a JSON-only endpoint, .exe uploaded as an avatar.
 *
 * 416 Range Not Satisfiable (HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
 *   The Range header cannot be satisfied.
 *   Ex: bytes=5000-6000 on a 1000-byte file.
 *
 * 417 Expectation Failed (HttpStatus.EXPECTATION_FAILED)
 *   The Expect header cannot be met.
 *   Ex: Expect: 100-continue rejected by the server.
 *
 * 418 I'm a teapot (HttpStatus.I_AM_A_TEAPOT)
 *   Joke status; do not use in real APIs.
 *
 * 421 Misdirected Request (HttpStatus.MISDIRECTED)
 *   Request was sent to a server that cannot produce a response.
 *   Ex: wrong host reused on an HTTP/2 connection.
 *
 * 422 Unprocessable Entity (HttpStatus.UNPROCESSABLE_ENTITY)  [BusinessRuleViolationError]
 *   Syntax is valid, but a business rule rejects it.
 *   Ex: insufficient stock, cannot cancel a shipped order.
 *
 * 423 Locked (HttpStatus.LOCKED)
 *   The resource is locked.
 *   Ex: inventory count in progress, stock is frozen.
 *
 * 424 Failed Dependency (HttpStatus.FAILED_DEPENDENCY)
 *   Failed because a previous request it depends on failed.
 *   Ex: batch step 3 skipped because step 2 failed.
 *
 * 425 Too Early (no HttpStatus member; use 425)
 *   The server refuses to process a request that might be replayed.
 *   Ex: TLS early data (0-RTT) on a non-idempotent endpoint.
 *
 * 426 Upgrade Required (no HttpStatus member; use 426)
 *   The client must switch protocol.
 *   Ex: endpoint that only works over WebSocket / newer TLS.
 *
 * 428 Precondition Required (HttpStatus.PRECONDITION_REQUIRED)
 *   The server requires a conditional request to avoid lost updates.
 *   Ex: PUT without If-Match on a versioned resource.
 *
 * 429 Too Many Requests (HttpStatus.TOO_MANY_REQUESTS)
 *   Rate limit exceeded; send Retry-After when possible.
 *   Ex: login attempts, OTP requests per minute.
 *
 * 431 Request Header Fields Too Large (no HttpStatus member; use 431)
 *   Headers (or a single header) are too big.
 *   Ex: oversized cookie.
 *
 * 451 Unavailable For Legal Reasons (HttpStatus.UNAVAILABLE_FOR_LEGAL_REASONS)
 *   Blocked for legal reasons.
 *   Ex: content removed by court order or region restriction.
 */
