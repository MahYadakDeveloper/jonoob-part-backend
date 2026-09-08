export interface HashService {
  /**
   * Create a secure hash from a plain value.
   */
  hash(value: string): Promise<string>;

  /**
   * Compare a plain value against a previously generated hash.
   */
  verify(value: string, hash: string): Promise<boolean>;
}
