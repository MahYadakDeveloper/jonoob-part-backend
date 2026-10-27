import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';

/**
 * Naming domain errors:
 * - Name the business condition, not the technical cause or HTTP status
 *   (InsufficientBalanceError, not BadRequestError or PgCheckViolationError).
 * - Format: <Subject><Condition>Error, e.g. MovementNotFoundError,
 *   WalletInsufficientBalanceError. Use "Failure" only for a generic
 *   operation failure with a `reason` param (MovementFailure).
 * - Past-tense or state words read best: NotFound, AlreadyExists,
 *   Expired, Insufficient, Invalid, Forbidden.
 * - The code mirrors the name: MovementNotFoundError -> MOVEMENT_NOT_FOUND.
 * - One class per distinct client behavior; reasons that only differ in
 *   detail go into `params`, not into new classes.
 */
export abstract class DomainError extends Error {
  static readonly code: string;

  get code(): string {
    return (this.constructor as typeof DomainError).code;
  }

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

export interface HttpErrorDescriptor<T extends DomainError = DomainError> {
  error: Type<T> & { code: string };
  status: HttpStatus;
  description: string;
}

export const httpError = <T extends DomainError>(
  error: HttpErrorDescriptor<T>['error'],
  status: HttpStatus,
  description: string,
): HttpErrorDescriptor<T> => ({ error, status, description });

export class ProblemDetailsDto {
  @ApiProperty() type!: string;
  @ApiProperty() title!: string;
  @ApiProperty() status!: number;
  @ApiProperty() code!: string;
  @ApiPropertyOptional() detail?: string;
}

export function ApiDomainErrors(...descriptors: HttpErrorDescriptor[]) {
  const byStatus = Object.groupBy(descriptors, (d) => d.status);

  return applyDecorators(
    ApiExtraModels(ProblemDetailsDto),
    ...Object.entries(byStatus).map(([status, list = []]) =>
      ApiResponse({
        status: Number(status),
        description: list.map((d) => d.description).join(' / '),
        content: {
          'application/problem+json': {
            schema: { $ref: getSchemaPath(ProblemDetailsDto) },
            examples: Object.fromEntries(
              list.map((d) => [
                d.error.code,
                {
                  value: {
                    type: `urn:error:${d.error.code}`,
                    title: d.description,
                    status: d.status,
                    code: d.error.code,
                  },
                },
              ]),
            ),
          },
        },
      }),
    ),
  );
}
