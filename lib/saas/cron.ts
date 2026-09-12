import { timingSafeEqual } from 'crypto';

export type CronAuthorizationResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Shared cron authentication guard.
 * Fails closed when CRON_SECRET is missing or too short, and compares tokens
 * in constant time to avoid leaking secret prefixes through timing.
 */
export function validateCronAuthorization(request: Request): CronAuthorizationResult {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret || secret.length < 16) {
    return { ok: false, status: 503, error: 'Cron authentication is not configured.' };
  }

  const authHeader = request.headers.get('authorization') || '';
  const prefix = 'Bearer ';
  if (!authHeader.startsWith(prefix)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const supplied = authHeader.slice(prefix.length);
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);

  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  return { ok: true };
}
