import { describe, expect, it, vi } from "vitest"
import { createApp, type AppDependencies } from "./app.js"

const validContact = {
  company: "株式会社サンプル",
  name: "山田 太郎",
  email: "contact@example.com",
  phone: "045-000-0000",
  category: "労務管理相談",
  message: "就業規則の見直しについて相談を希望します。",
  privacy: true,
  turnstileToken: "test-token",
} as const

const createDependencies = (overrides: Partial<AppDependencies> = {}): AppDependencies => ({
  turnstileSiteKey: "test-site-key",
  turnstileVerifier: { verify: vi.fn().mockResolvedValue("valid") },
  contactMailer: { send: vi.fn().mockResolvedValue(undefined) },
  rateLimiter: { consume: vi.fn().mockReturnValue({ allowed: true }) },
  ...overrides,
})

const postContact = (app: ReturnType<typeof createApp>, body: unknown, contentType = "application/json") =>
  app.request("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "CF-Connecting-IP": "203.0.113.10",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })

describe("health endpoints", () => {
  const app = createApp(createDependencies(), { staticRoot: "public" })

  it("serves /healthz", async () => {
    const response = await app.request("/healthz")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: "ok" })
  })

  it("applies security headers to health responses", async () => {
    const response = await app.request("/healthz")

    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'")
    expect(response.headers.get("strict-transport-security")).toBe("max-age=31536000; includeSubDomains")
    expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin")
    expect(response.headers.get("cross-origin-resource-policy")).toBe("same-origin")
    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
  })
})

describe("contact API", () => {
  it("sends both messages only after validation and Turnstile verification", async () => {
    const dependencies = createDependencies()
    const app = createApp(dependencies, { staticRoot: "public" })
    const response = await postContact(app, validContact, "application/json; charset=UTF-8")

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({ success: true })
    expect(dependencies.turnstileVerifier.verify).toHaveBeenCalledWith(
      "test-token",
      "203.0.113.10",
    )
    expect(dependencies.contactMailer.send).toHaveBeenCalledWith(validContact)
  })

  it.each([
    ["text/plain", 415, "UNSUPPORTED_MEDIA_TYPE"],
    ["application/json-malformed", 415, "UNSUPPORTED_MEDIA_TYPE"],
  ])("rejects content type %s", async (contentType, status, code) => {
    const response = await postContact(createApp(createDependencies(), { staticRoot: "public" }), validContact, contentType)
    expect(response.status).toBe(status)
    expect((await response.json()).error.code).toBe(code)
  })

  it("rejects malformed JSON", async () => {
    const response = await postContact(createApp(createDependencies(), { staticRoot: "public" }), "{")
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe("INVALID_REQUEST")
  })

  it.each([
    [{ ...validContact, privacy: false }, "privacy"],
    [{ ...validContact, email: "invalid" }, "email"],
    [{ ...validContact, message: "短い" }, "message"],
    [{ ...validContact, extra: "rejected" }, "body"],
  ])("rejects invalid contact data", async (body, expectedField) => {
    const dependencies = createDependencies()
    const response = await postContact(createApp(dependencies, { staticRoot: "public" }), body)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error.code).toBe("INVALID_REQUEST")
    expect(result.fieldErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: expectedField }),
    ]))
    expect(dependencies.contactMailer.send).not.toHaveBeenCalled()
  })

  it.each([
    ["invalid", 403, "TURNSTILE_FAILED"],
    ["unavailable", 503, "TURNSTILE_UNAVAILABLE"],
  ] as const)("handles a %s Turnstile result", async (result, status, code) => {
    const dependencies = createDependencies({
      turnstileVerifier: { verify: vi.fn().mockResolvedValue(result) },
    })
    const response = await postContact(createApp(dependencies, { staticRoot: "public" }), validContact)

    expect(response.status).toBe(status)
    expect((await response.json()).error.code).toBe(code)
    expect(dependencies.contactMailer.send).not.toHaveBeenCalled()
  })

  it("returns a temporary failure when SMTP delivery fails", async () => {
    const app = createApp(createDependencies({
      contactMailer: { send: vi.fn().mockRejectedValue(new Error("smtp failure")) },
    }), { staticRoot: "public" })
    const response = await postContact(app, validContact)

    expect(response.status).toBe(503)
    expect(response.headers.get("retry-after")).toBe("60")
    expect((await response.json()).error.code).toBe("MAIL_DELIVERY_UNAVAILABLE")
  })

  it("enforces the application rate limit", async () => {
    const app = createApp(createDependencies({
      rateLimiter: { consume: vi.fn().mockReturnValue({ allowed: false, retryAfterSeconds: 42 }) },
    }), { staticRoot: "public" })
    const response = await postContact(app, validContact)

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("42")
    expect((await response.json()).error.code).toBe("RATE_LIMITED")
  })

  it("rejects request bodies larger than 16 KiB", async () => {
    const response = await postContact(createApp(createDependencies(), { staticRoot: "public" }), {
      ...validContact,
      message: "a".repeat(17 * 1024),
    })
    expect(response.status).toBe(413)
    expect((await response.json()).error.code).toBe("PAYLOAD_TOO_LARGE")
  })

  it("returns JSON for unsupported methods and unknown API routes", async () => {
    const app = createApp(createDependencies(), { staticRoot: "public" })
    const methodResponse = await app.request("/api/contact", { method: "GET" })
    const notFoundResponse = await app.request("/api/unknown")

    expect(methodResponse.status).toBe(405)
    expect(methodResponse.headers.get("allow")).toBe("POST")
    expect((await methodResponse.json()).error.code).toBe("METHOD_NOT_ALLOWED")
    expect(notFoundResponse.status).toBe(404)
    expect((await notFoundResponse.json()).error.code).toBe("NOT_FOUND")
  })

  it("does not expose unexpected errors", async () => {
    const app = createApp(createDependencies({
      turnstileVerifier: { verify: vi.fn().mockRejectedValue(new Error("sensitive detail")) },
    }), { staticRoot: "public" })
    const response = await postContact(app, validContact)
    const body = await response.text()

    expect(response.status).toBe(500)
    expect(body).toContain("INTERNAL_ERROR")
    expect(body).not.toContain("sensitive detail")
  })
})

describe("page rendering", () => {
  const app = createApp(createDependencies(), { staticRoot: "public" })

  it("renders the home page through the shared layout", async () => {
    const response = await app.request("/")
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/html")
    expect(body).toContain("<!DOCTYPE html>")
    expect(body).toContain("企業の人と労務に、")
    expect(body).toContain('href="/css/styles.css"')
    expect(body).toContain('data-sitekey="test-site-key"')
    expect(response.headers.get("content-security-policy")).toContain("script-src 'self'")
    expect(response.headers.get("strict-transport-security")).toBe("max-age=31536000; includeSubDomains")
    expect(response.headers.get("content-security-policy")).toContain("https://www.google.com")
  })

  it("renders the privacy page with its page-specific stylesheet", async () => {
    const response = await app.request("/privacy")
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain("特定個人情報等の適正な取扱いに関する基本方針")
    expect(body).toContain('href="/css/privacy.css"')
    expect(body).toContain('aria-current="page"')
  })

  it.each([
    ["/index.html", "/"],
    ["/privacy.html", "/privacy"],
    ["/privacy/", "/privacy"],
  ])("redirects %s to %s", async (path, destination) => {
    const response = await app.request(path)
    expect(response.status).toBe(301)
    expect(response.headers.get("location")).toBe(destination)
  })

  it("renders the shared 404 page with a not-found status", async () => {
    const response = await app.request("/missing-page")
    const body = await response.text()

    expect(response.status).toBe(404)
    expect(body).toContain("ページが見つかりません")
    expect(body).toContain('name="robots" content="noindex, follow"')
  })
})
