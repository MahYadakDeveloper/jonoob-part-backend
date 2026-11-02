import { Command } from '@feature/shared/cqrs';
import { type Database, InjectDrizzle } from '@infra/db-drizzle';
import { procurement } from '@infra/schema/procurement.schema';

import { Injectable } from '@nestjs/common';

type Procurement = typeof procurement.$inferInsert;

/**
 * Sample DB error mapping. Reference only, do not uncomment as is; adapt it to
 * the real schema and errors. Domain errors come from @feature/procurement-errors
 * (import from '@feature/procurement-errors/procurement.errors'); DbErrors, onFk and onPk come from
 * '@infra/db-drizzle'.
 *
 * @example
 * ```ts
 * @DbErrors({
 *   constraints: {
 *     // Foreign key violation -> domain error built from the row values
 *     ...onFk(
 *       procurement,
 *       'relatedId',
 *       ({ relatedId }) => new RelatedNotFoundError(relatedId),
 *     ),
 *     // Primary key violation -> domain error
 *     ...onPk(procurement, ProcurementDuplicateError),
 *     // Check constraint name -> domain error
 *     [PROCUREMENT_CHECKS.someRule]: ProcurementInvalidStateError,
 *   },
 *   // Error kinds (e.g. malformed input) -> domain error
 *   kinds: { invalidInput: MalformedInputError },
 * })
 * ```
 */
@Injectable()
export class ProcurementCommand implements Command<Procurement, void> {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async execute(input: Procurement): Promise<void> {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
