export type TokenType = 'access' | 'refresh' | 'verify' | 'challenge';
export interface TokenPayload {
  jti: string;
  sub: string;
  typ: TokenType;

  /** Token issued at */
  iat: number;

  /** Token expiration */
  exp: number;

  /** Optional session identifier. Useful for revoking a specific session. */
  sid?: string;

  /** Optional custom claims. */
  [key: string]: unknown;
}
