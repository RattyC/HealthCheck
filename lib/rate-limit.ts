import { LRUCache } from "lru-cache";

const windowMs = 60_000;
const max = Number(process.env.RATE_LIMIT_MAX ?? 60);

const tokenCache = new LRUCache<string, { tokens: number; last: number }>({
  max: 5000,
});

export function rateLimit(key: string, limit = max) {
  const now = Date.now();
  const entry = tokenCache.get(key);
  if (!entry) {
    tokenCache.set(key, { tokens: 1, last: now });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }
  const elapsed = now - entry.last;
  if (elapsed > windowMs) {
    tokenCache.set(key, { tokens: 1, last: now });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }
  if (entry.tokens >= limit) {
    return { success: false, limit, remaining: 0, reset: entry.last + windowMs };
  }
  entry.tokens += 1;
  tokenCache.set(key, entry);
  return { success: true, limit, remaining: limit - entry.tokens, reset: entry.last + windowMs };
}
