import { bodyLimit } from "hono/body-limit"
import { Hono } from "hono"
import { contactRequestSchema } from "../contact/schema.js"
import type { ContactMailer, ContactRateLimiter, TurnstileVerifier } from "../contact/types.js"

const maxBodySize = 16 * 1024

// createApiRoutes()の中で以下のオブジェクトを渡すため、型を定義しておく
type ApiDependencies = {
  turnstileVerifier: TurnstileVerifier
  contactMailer: ContactMailer
  rateLimiter: ContactRateLimiter
}

type ErrorCode =
  | "INVALID_REQUEST"
  | "TURNSTILE_FAILED"
  | "TURNSTILE_UNAVAILABLE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "MAIL_DELIVERY_UNAVAILABLE"
  | "METHOD_NOT_ALLOWED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"

const messages: Record<ErrorCode, string> = {
  INVALID_REQUEST: "入力内容をご確認ください。",
  TURNSTILE_FAILED: "セキュリティ確認に失敗しました。もう一度お試しください。",
  TURNSTILE_UNAVAILABLE: "セキュリティ確認を利用できません。時間をおいて再度お試しください。",
  UNSUPPORTED_MEDIA_TYPE: "対応していないリクエスト形式です。",
  PAYLOAD_TOO_LARGE: "入力内容が大きすぎます。",
  RATE_LIMITED: "送信回数が多すぎます。時間をおいて再度お試しください。",
  MAIL_DELIVERY_UNAVAILABLE: "現在お問い合わせを送信できません。時間をおいて再度お試しください。",
  METHOD_NOT_ALLOWED: "許可されていないHTTPメソッドです。",
  NOT_FOUND: "APIが見つかりません。",
  INTERNAL_ERROR: "サーバーでエラーが発生しました。時間をおいて再度お試しください。",
}

const fieldNames = new Set([
  "company",
  "name",
  "email",
  "phone",
  "category",
  "message",
  "privacy",
  "turnstileToken",
])

const fieldMessage = (field: string) => {
  if (field === "privacy") return "個人情報保護方針への同意が必要です。"
  if (field === "turnstileToken") return "セキュリティ確認が必要です。"
  return "入力内容を確認してください。"
}

type ValidationIssue = {
  code: string
  input?: unknown
  path: PropertyKey[]
}

const issueCode = (issue: ValidationIssue) => {
  if (issue.code === "invalid_type" && issue.input === undefined) return "required" as const
  if (issue.code === "too_small") return "too_short" as const
  if (issue.code === "too_big") return "too_long" as const
  if (issue.code === "unrecognized_keys") return "unrecognized_key" as const
  return "invalid" as const
}

const toFieldErrors = (issues: ValidationIssue[]) =>
  issues.slice(0, 20).map((issue) => {
    const candidate = String(issue.path[0] ?? "body")
    const field = fieldNames.has(candidate) ? candidate : "body"
    return {
      field,
      code: issueCode(issue),
      message: fieldMessage(field),
    }
  })

const failure = (code: ErrorCode, fieldErrors?: ReturnType<typeof toFieldErrors>) => ({
  success: false as const,
  error: { code, message: messages[code] },
  ...(fieldErrors?.length ? { fieldErrors } : {}),
})

export function createApiRoutes(dependencies: ApiDependencies) {
  const api = new Hono()

  // cはHonoが各リクエストごとに渡してくるコンテキスト
  api.use("*", async (c, next) => {
    await next()
    c.header("Cache-Control", "no-store")
  })

  api.post(
    "/contact",
    bodyLimit({
      maxSize: maxBodySize,
      onError: (c) => c.json(failure("PAYLOAD_TOO_LARGE"), 413),
    }),
    async (c) => {
      // リクエスト形式を確認する
      const contentType = c.req.header("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
      if (contentType !== "application/json") {
        return c.json(failure("UNSUPPORTED_MEDIA_TYPE"), 415)
      }

      // 送信回数を制限する
      const clientKey = (c.req.header("cf-connecting-ip") ?? "unknown").slice(0, 64)
      const rateLimit = dependencies.rateLimiter.consume(clientKey)
      if (!rateLimit.allowed) {
        c.header("Retry-After", String(rateLimit.retryAfterSeconds ?? 60))
        return c.json(failure("RATE_LIMITED"), 429)
      }

      // JSON本文を読み込む
      let body: unknown
      try {
        body = await c.req.json()
      } catch {
        return c.json(failure("INVALID_REQUEST", [{
          field: "body",
          code: "invalid",
          message: "JSONの形式を確認してください。",
        }]), 400)
      }

      // スキーマで入力を検証する
      const validation = contactRequestSchema.safeParse(body)
      if (!validation.success) {
        return c.json(failure("INVALID_REQUEST", toFieldErrors(validation.error.issues)), 400)
      }

      // Turnstileを検証する
      const turnstile = await dependencies.turnstileVerifier.verify(
        validation.data.turnstileToken,
        c.req.header("cf-connecting-ip"),
      )

      // Turnstile検証結果が不正
      if (turnstile === "invalid") return c.json(failure("TURNSTILE_FAILED"), 403)
      // Turnstileの判定に失敗
      if (turnstile === "unavailable") {
        c.header("Retry-After", "60")
        return c.json(failure("TURNSTILE_UNAVAILABLE"), 503)
      }

      // 問い合わせメールを送信する
      try {
        await dependencies.contactMailer.send(validation.data)
      } catch {
        c.header("Retry-After", "60")
        return c.json(failure("MAIL_DELIVERY_UNAVAILABLE"), 503)
      }

      // 成功レスポンスを返す
      return c.json({ success: true as const }, 200)
    },
  )

  api.all("/contact", (c) => {
    c.header("Allow", "POST")
    return c.json(failure("METHOD_NOT_ALLOWED"), 405)
  })

  api.all("/*", (c) => c.json(failure("NOT_FOUND"), 404))
  api.onError((_error, c) => c.json(failure("INTERNAL_ERROR"), 500))

  return api
}
