export type DbLockMode = 'for_update';

export interface DbLockContext {
  current(): DbLockMode | undefined;

  run<T>(mode: DbLockMode, fn: () => Promise<T>): Promise<T>;
}
