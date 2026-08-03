export interface Synchronizer {
  executeExclusive<T>(key: string, callback: () => Promise<T>): Promise<T>;
}
