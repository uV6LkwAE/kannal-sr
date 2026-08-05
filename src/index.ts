import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { loadAppConfig } from "./config/env.js"
import { GmailContactMailer } from "./services/mailer.js"
import { MemoryContactRateLimiter } from "./services/rate-limit.js"
import { CloudflareTurnstileVerifier } from "./services/turnstile.js"

const host = process.env.HOST ?? "0.0.0.0"
const port = Number(process.env.PORT ?? "3000")
const config = loadAppConfig(process.env)
const app = createApp({
  turnstileSiteKey: config.turnstile.siteKey,
  turnstileVerifier: new CloudflareTurnstileVerifier(config.turnstile),
  contactMailer: new GmailContactMailer(config.mail),
  rateLimiter: new MemoryContactRateLimiter(),
})

const server = serve({
  fetch: app.fetch,
  hostname: host,
  port
})

const shutdown = (signal: NodeJS.Signals) => {
  server.close((error) => {
    if (error) {
      console.error("Failed to stop HTTP server", { signal, error })
      process.exitCode = 1
    }
  })
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
