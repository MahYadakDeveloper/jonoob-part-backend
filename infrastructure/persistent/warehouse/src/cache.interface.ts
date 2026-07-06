export interface ICache {
  get<T>(key: string): Promise<T | undefined>;

  set<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
    },
  ): Promise<void>;

  invalidate(key: string): Promise<void>;

  invalidateMany(keys: string[]): Promise<void>;
}
