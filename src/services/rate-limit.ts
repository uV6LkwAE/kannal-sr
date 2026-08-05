import type { ContactRateLimiter, RateLimitResult } from "../contact/types.js"

type Entry = {
  count: number
  expiresAt: number
}

export class MemoryContactRateLimiter implements ContactRateLimiter {
  private readonly entries = new Map<string, Entry>()

  constructor(
    private readonly limit = 5,
    private readonly windowMs = 10 * 60 * 1000,
    private readonly now: () => number = Date.now,
  ) {}

  consume(key: string): RateLimitResult {
    const now = this.now()
    this.prune(now)

    const current = this.entries.get(key)
    if (!current || current.expiresAt <= now) {
      this.entries.set(key, { count: 1, expiresAt: now + this.windowMs })
      return { allowed: true }
    }

    if (current.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
      }
    }

    current.count += 1
    return { allowed: true }
  }

  private prune(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key)
    }

    if (this.entries.size > 10_000) {
      const oldestKey = this.entries.keys().next().value
      if (oldestKey) this.entries.delete(oldestKey)
    }
  }
}
