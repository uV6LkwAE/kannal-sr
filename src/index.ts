// 設定を読み、依存を作って、サーバーを建てる
// loadAppConfigを呼び、直接envは見に行かない
import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { loadAppConfig } from "./config/env.js"
import { GmailContactMailer } from "./services/mailer.js"
import { MemoryContactRateLimiter } from "./services/rate-limit.js"
import { CloudflareTurnstileVerifier } from "./services/turnstile.js"

const config = loadAppConfig(process.env)
const app = createApp({
  turnstileSiteKey: config.turnstile.siteKey,
  turnstileVerifier: new CloudflareTurnstileVerifier(config.turnstile),
  contactMailer: new GmailContactMailer(config.mail),
  rateLimiter: new MemoryContactRateLimiter(),
}, {
  staticRoot: config.server.staticRoot,
})

const server = serve({
  fetch: app.fetch,
  hostname: config.server.host,
  port: config.server.port,
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
