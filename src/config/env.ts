// NODEJS.ProcessEnvを受け取り、このアプリ用の設定オブジェクトに変換する
// Zodでバリデーションもしている
// process.envにはOSから渡された環境変数が入っている
// 環境変数をどう解釈するかの責務
import { z } from "zod"

const email = z.string().trim().pipe(z.email().max(254))
const port = z.coerce.number().int().min(1).max(65535)

const envSchema = z.object({
  HOST: z.string().trim().min(1),
  PORT: port,
  STATIC_ROOT: z.string().trim().min(1),
  TURNSTILE_SITE_KEY: z.string().trim().min(1),
  TURNSTILE_SECRET_KEY: z.string().trim().min(1),
  TURNSTILE_EXPECTED_HOSTNAME: z.string().trim().min(1),
  SMTP_USER: email,
  SMTP_APP_PASSWORD: z.string().min(1),
  CONTACT_TO_EMAIL: email,
})

export type AppConfig = {
  server: {
    host: string
    port: number
    staticRoot: string
  }
  turnstile: {
    siteKey: string
    secretKey: string
    expectedHostname: string
    expectedAction: "contact"
    timeoutMs: number
  }
  mail: {
    host: "smtp.gmail.com"
    port: 465
    secure: true
    user: string
    appPassword: string
    officeAddress: string
  }
}

export class InvalidEnvironmentError extends Error {
  constructor(readonly keys: string[]) {
    super(`Invalid or missing environment variables: ${keys.join(", ")}`)
    this.name = "InvalidEnvironmentError"
  }
}

export function loadAppConfig(environment: NodeJS.ProcessEnv): AppConfig {
  const result = envSchema.safeParse(environment)

  if (!result.success) {
    const keys = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))]
    throw new InvalidEnvironmentError(keys)
  }

  return {
    server: {
      host: result.data.HOST,
      port: result.data.PORT,
      staticRoot: result.data.STATIC_ROOT,
    },
    turnstile: {
      siteKey: result.data.TURNSTILE_SITE_KEY,
      secretKey: result.data.TURNSTILE_SECRET_KEY,
      expectedHostname: result.data.TURNSTILE_EXPECTED_HOSTNAME,
      expectedAction: "contact",
      timeoutMs: 5_000,
    },
    mail: {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      user: result.data.SMTP_USER,
      appPassword: result.data.SMTP_APP_PASSWORD,
      officeAddress: result.data.CONTACT_TO_EMAIL,
    },
  }
}
