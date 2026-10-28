import { DomainError } from '@feature/shared/errors';

/**
 * Naming domain errors:
 *
 * - Name the business condition, not the technical cause or HTTP status
 *   (InsufficientBalanceError, not BadRequestError or PgCheckViolationError).
 * - Format: <Subject><Condition>Error, e.g. MovementNotFoundError,
 *   WalletInsufficientBalanceError. Use "Failure" only for a generic operation
 *   failure with a `reason` param (MovementFailure).
 * - Past-tense or state words read best: NotFound, AlreadyExists, Expired,
 *   Insufficient, Invalid, Forbidden.
 * - The code mirrors the name: MovementNotFoundError -> MOVEMENT_NOT_FOUND.
 * - One class per distinct client behavior; reasons that only differ in detail go
 *   into `params`, not into new classes.
 */
export class MovementNotFoundError extends DomainError {}
export class MovementFailure extends DomainError {}
