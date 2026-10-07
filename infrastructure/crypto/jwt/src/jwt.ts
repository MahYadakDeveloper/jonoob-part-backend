export type TokenType = 'access' | 'refresh' | 'verify';
export interface TokenPayload {
  jti: string;
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
   * Additional claims.
   */
  claims?: Record<string, unknown>;
}
