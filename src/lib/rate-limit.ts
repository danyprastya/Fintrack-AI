/**
 * Simple in-memory rate limiter for API routes.
 * For production, use Redis (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000); // Every 60 seconds

interface RateLimitOptions {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (e.g., IP address, phone number).
 * Returns whether the request is allowed.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1, resetAt: now + options.windowMs };
  }

  if (entry.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: options.maxRequests - entry.count, resetAt: entry.resetAt };
}

/** Rate limit presets */
export const RATE_LIMITS = {
  /** OTP sending: max 3 per 5 minutes per phone */
  otpSend: { maxRequests: 3, windowMs: 5 * 60 * 1000 },
  /** OTP verify: max 5 attempts per 5 minutes per phone */
  otpVerify: { maxRequests: 5, windowMs: 5 * 60 * 1000 },
  /** Login: max 10 per 15 minutes per IP */
  login: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
  /** Registration: max 5 per hour per IP */
  register: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  /** Telegram link code: max 10 per hour per user */
  telegramLink: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
};
