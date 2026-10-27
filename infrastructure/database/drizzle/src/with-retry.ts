import { isRetryableDbError } from './db-error';

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
}

/** Re-runs `fn` on serialization failures and deadlocks. Call it outside the transaction. */
export async function withRetry<R>(
  fn: () => Promise<R>,
  { attempts = 3, baseDelayMs = 50 }: RetryOptions = {},
): Promise<R> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= attempts || !isRetryableDbError(e)) throw e;
      const delay = baseDelayMs * 2 ** (attempt - 1) * (0.5 + Math.random());
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
