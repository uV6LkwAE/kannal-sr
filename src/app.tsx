// ルーティングとミドルウェア設定をまとめている
import { resolve } from "node:path"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { jsxRenderer } from "hono/jsx-renderer"
import { SiteLayout } from "./components/SiteLayout.js"
import {
  notFoundMetadata,
  type PageMetadata,
} from "./page-metadata.js"
import { NotFoundPage } from "./pages/NotFoundPage.js"
import type { ContactMailer, ContactRateLimiter, TurnstileVerifier } from "./contact/types.js"
import { createApiRoutes } from "./routes/api.js"
import { createPageRoutes } from "./routes/pages.js"

declare module "hono" {
  interface ContextRenderer {
    (content: string | Promise<string>, props: PageMetadata): Response
  }
}

export type AppDependencies = {
  turnstileSiteKey: string
  turnstileVerifier: TurnstileVerifier
  contactMailer: ContactMailer
  rateLimiter: ContactRateLimiter
}

export type AppSettings = {
  staticRoot: string
}

export function createApp(dependencies: AppDependencies, settings: AppSettings) {
  const app = new Hono()
  const staticRoot = resolve(settings.staticRoot)

  app.use("*", async (c, next) => {
    await next()
    c.header(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "script-src 'self' https://challenges.cloudflare.com",
        "style-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://challenges.cloudflare.com",
        "frame-src https://challenges.cloudflare.com https://www.google.com https://maps.google.com",
      ].join("; "),
    )
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    c.header("Cross-Origin-Opener-Policy", "same-origin")
    c.header("Cross-Origin-Resource-Policy", "same-origin")
    c.header("X-Content-Type-Options", "nosniff")
    c.header("Referrer-Policy", "strict-origin-when-cross-origin")
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  })

  app.use(
    "*",
    jsxRenderer(({ children, ...metadata }) => (
      <SiteLayout {...(metadata as PageMetadata)}>{children}</SiteLayout>
    )),
  )

  app.get("/healthz", (c) => c.json({ status: "ok" }))

  app.route("/api", createApiRoutes(dependencies))
  app.route("/", createPageRoutes(dependencies.turnstileSiteKey))

  for (const path of ["/favicon.ico", "/robots.txt", "/sitemap.xml"]) {
    app.get(path, serveStatic({ root: staticRoot }))
  }

  for (const path of ["/assets/*", "/css/*", "/js/*"]) {
    app.get(path, serveStatic({ root: staticRoot }))
  }

  app.notFound((c) => {
    c.status(404)
    return c.render(<NotFoundPage />, notFoundMetadata)
  })

  return app
}
