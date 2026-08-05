import type { ContactRequest } from "./schema.js"

export type TurnstileResult = "valid" | "invalid" | "unavailable"

export interface TurnstileVerifier {
  verify(token: string, remoteIp?: string): Promise<TurnstileResult>
}

export interface ContactMailer {
  send(data: ContactRequest): Promise<void>
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds?: number
}

export interface ContactRateLimiter {
  consume(key: string): RateLimitResult
}
