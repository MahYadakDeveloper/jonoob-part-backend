export interface Cache<T> {
  set(key: string, value: T, options?: { ttl?: number }): Promise<void>;
  setMany(
    entries: ReadonlyMap<string, T>,
    options?: { ttl?: number },
  ): Promise<void>;

  get(key: string): Promise<T | null>;
  getMany(keys: string[]): Promise<Map<string, T | null>>;

  has(key: string): Promise<boolean>;
  hasMany(keys: string[]): Promise<Map<string, boolean>>;

  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
}
