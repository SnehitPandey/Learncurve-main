import Groq from 'groq-sdk';
import { AIServiceError } from './errors';

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(err: any): number | null {
  const raw = err?.headers?.['retry-after'] ?? err?.error?.retry_after;
  if (!raw) return null;
  const seconds = parseFloat(raw);
  return isNaN(seconds) ? null : seconds * 1000;
}

export async function groqWithRetry(
  client: Groq,
  requestFn: (client: Groq) => Promise<Groq.Chat.ChatCompletion>
): Promise<Groq.Chat.ChatCompletion> {
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      return await requestFn(client);
    } catch (err: any) {
      const is429 =
        err?.status === 429 || err?.error?.type === 'rate_limit_exceeded';
      const isTransient =
        err?.status === 500 || err?.status === 503 || err?.error?.type === 'server_error';
      const shouldRetry = is429 || isTransient;

      if (!shouldRetry || attempt === MAX_RETRIES) {
        throw new AIServiceError(
          attempt === MAX_RETRIES
            ? `Groq rate limit exceeded after ${MAX_RETRIES} retries`
            : `Groq request failed: ${err.message}`
        );
      }

      // Respect Retry-After header if Groq provides it
      const retryAfterMs = parseRetryAfter(err);

      // Exponential backoff: 1s, 2s, 4s, 8s + random jitter (0–500ms)
      const backoff =
        retryAfterMs ??
        BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;

      const errorType = is429 ? '429' : `${err?.status ?? 'unknown'}`;
      console.warn(
        `[Groq] ${errorType} on attempt ${attempt + 1}. Retrying in ${Math.round(backoff)}ms...`
      );
      await sleep(backoff);
      attempt++;
    }
  }

  throw new AIServiceError('Groq retry loop exited unexpectedly');
}
