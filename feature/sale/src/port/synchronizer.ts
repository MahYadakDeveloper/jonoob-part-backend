export interface ISynchronizer {
  executeExclusive<T>(key: string, callback: () => Promise<T>): Promise<T>;
}
