import { Module, type OnModuleInit } from '@nestjs/common';
// Adjust to your real alias / package name for shared/impl
import { setRepositoryErrorClassifier } from '@shared/impl/repository';
// classifyPgError must now import RepositoryErrorInfo / RepositoryErrorKind from shared/impl
import { classifyPgError } from './pg/pg-error';

/**
 * Dialect switch: the only place to change for another database.
 * Import this module from the database module so it is always bootstrapped.
 */
@Module({})
export class RepositoryErrorsModule implements OnModuleInit {
  onModuleInit(): void {
    setRepositoryErrorClassifier(classifyPgError);
  }
}
