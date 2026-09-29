export interface TransactionManager<T = unknown> {
  run<U>(fn: () => Promise<U>): Promise<U>;
  current(): T | null;
}
