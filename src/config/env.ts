import { z } from "zod"

const email = z.string().trim().pipe(z.email().max(254))

const envSchema = z.object({
  TURNSTILE_SITE_KEY: z.string().trim().min(1),
  TURNSTILE_SECRET_KEY: z.string().trim().min(1),
  TURNSTILE_EXPECTED_HOSTNAME: z.string().trim().min(1),
  SMTP_USER: email,
  SMTP_APP_PASSWORD: z.string().min(1),
  CONTACT_TO_EMAIL: email,
})

export type AppConfig = {
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
