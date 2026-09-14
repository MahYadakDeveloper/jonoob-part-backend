export interface SetStore {
  /**
   * Store a value.
   *
   * @param ttl Time-to-live in seconds.
   */
  set(key: string, ttl?: number): Promise<void>;

  has(key: string): Promise<boolean>;

  delete(key: string): Promise<void>;
}
