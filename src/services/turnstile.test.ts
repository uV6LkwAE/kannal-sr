import { describe, expect, it, vi } from "vitest"
import type { AppConfig } from "../config/env.js"
import { CloudflareTurnstileVerifier } from "./turnstile.js"

const config: AppConfig["turnstile"] = {
  siteKey: "site-key",
  secretKey: "secret-key",
  expectedHostname: "yokohama-kannai-sr.com",
  expectedAction: "contact",
  timeoutMs: 5_000,
}

describe("CloudflareTurnstileVerifier", () => {
  it("accepts only a successful response with the expected hostname and action", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      hostname: "yokohama-kannai-sr.com",
      action: "contact",
    }), { status: 200 }))
    const verifier = new CloudflareTurnstileVerifier(config, request)

    await expect(verifier.verify("token", "203.0.113.10")).resolves.toBe("valid")
    const options = request.mock.calls[0][1]
    expect(String(options.body)).toContain("secret=secret-key")
    expect(String(options.body)).toContain("response=token")
    expect(String(options.body)).toContain("remoteip=203.0.113.10")
  })

  it.each([
    [{ success: false }, "invalid"],
    [{ success: true, hostname: "attacker.example", action: "contact" }, "invalid"],
    [{ success: true, hostname: "yokohama-kannai-sr.com", action: "other" }, "invalid"],
  ] as const)("maps a rejected verification to %s", async (payload, expected) => {
    const verifier = new CloudflareTurnstileVerifier(
      config,
      vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 })),
    )
    await expect(verifier.verify("token")).resolves.toBe(expected)
  })

  it("treats a network failure as unavailable", async () => {
    const verifier = new CloudflareTurnstileVerifier(
      config,
      vi.fn().mockRejectedValue(new Error("network failure")),
    )
    await expect(verifier.verify("token")).resolves.toBe("unavailable")
  })
})
