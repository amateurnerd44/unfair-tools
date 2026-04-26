import { logger } from "./logger";

interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  onRetry?: (error: Error, attempt: number) => void;
}

const defaults: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  opts: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, onRetry } = {
    ...defaults,
    ...opts,
  };

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === maxAttempts) break;

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      logger.warn({ label, attempt, delay, error: lastError.message }, "retrying");
      onRetry?.(lastError, attempt);

      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}
