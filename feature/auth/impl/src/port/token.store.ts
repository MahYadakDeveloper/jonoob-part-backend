export interface TokenStore {
  /**
   * @param ttl Time-to-live in seconds.
   */
  set(jti: string, ttl: number): Promise<void>;

  /**
   * [NOTE] Have to be atomicity operational
   * Consume an issued token.
   *
   * Throws if the token does not exist or has already been consumed.
   */
  consume(jti: string): Promise<void>;
}
