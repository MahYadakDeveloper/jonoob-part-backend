export interface LockableRepository {
  withLock<T>(fn: () => Promise<T>): Promise<T>;
}
