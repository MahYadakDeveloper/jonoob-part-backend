export interface Store<T = unknown> {
  /**
   * Store a value.
   *
   * @param ttl Time-to-live in seconds.
   */
  set(key: string, value: T, ttl?: number): Promise<void>;

  get(key: string): Promise<T | null>;

  /**
   * Get and delete a value atomically.
   */
  getDelete(key: string): Promise<T | null>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;
}
