import { z } from "zod"
import type { AppConfig } from "../config/env.js"
import type { TurnstileResult, TurnstileVerifier } from "../contact/types.js"

const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

const siteverifyResponseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
})

export class CloudflareTurnstileVerifier implements TurnstileVerifier {
  constructor(
    private readonly config: AppConfig["turnstile"],
    private readonly request: typeof fetch = fetch,
  ) {}

  async verify(token: string, remoteIp?: string): Promise<TurnstileResult> {
    const body = new URLSearchParams({
      secret: this.config.secretKey,
      response: token,
    })

    if (remoteIp) body.set("remoteip", remoteIp)

    try {
      const response = await this.request(siteverifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      })

      if (!response.ok) return "unavailable"

      const result = siteverifyResponseSchema.safeParse(await response.json())
      if (!result.success) return "unavailable"
      if (!result.data.success) return "invalid"
      if (result.data.hostname !== this.config.expectedHostname) return "invalid"
      if (result.data.action !== this.config.expectedAction) return "invalid"

      return "valid"
    } catch {
      return "unavailable"
    }
  }
}
