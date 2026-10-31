export interface IssueTokenOptions {
  type: TokenType;
  subject: string;

  /** Token lifetime in seconds. */
  expiresIn?: number;

  /** Additional claims. */
  claims?: Record<string, unknown>;
}
