export type TokenType = 'access' | 'refresh';

export interface TokenPayload {
  sub: string;
  type: TokenType;

  /**
   * Token issued at
   */
  iat: number;

  /**
   * Token expiration
   */
  exp: number;

  /**
   * Optional session identifier.
   * Useful for revoking a specific session.
   */
  sid?: string;

  /**
   * Optional custom claims.
   */
  [key: string]: unknown;
}

export interface IssueTokenOptions {
  type: TokenType;
  subject: string;

  /**
   * Token lifetime in seconds.
   */
  expiresIn?: number;

  /**
   * Session identifier.
   */
  sessionId?: string;

  /**
   * Additional claims.
   */
  claims?: Record<string, unknown>;
}

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
  verify(token: string, type?: TokenType): Promise<TokenPayload>;

  /**
   * Check whether token is valid.
   */
  isValid(token: string, type?: TokenType): Promise<boolean>;

  /**
   * Check whether token is expired.
   */
  isExpired(token: string): boolean;
}
