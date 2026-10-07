export interface TokenService {
  /**
   * Issue a new access/refresh token.
   */
  issue(options: IssueTokenOptions): Promise<string>;

  /**
   * Decode token without validating its signature.
   *
   * Useful only when you explicitly need to inspect
   * an untrusted token.
   */
  decode(token: string): TokenPayload | null;

  /**
   * Verify token signature and standard claims.
   *
   * Throws or returns null depending on implementation.
   */
  verify(token: string, type: TokenType): Promise<TokenPayload | null>;

  revoke(token: string, type: TokenType): Promise<void>;
}
