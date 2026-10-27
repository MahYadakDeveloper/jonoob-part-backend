import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';

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
