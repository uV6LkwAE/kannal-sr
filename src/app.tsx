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

const staticRoot = resolve(process.env.STATIC_ROOT ?? "public")

export type AppDependencies = {
  turnstileSiteKey: string
  turnstileVerifier: TurnstileVerifier
  contactMailer: ContactMailer
  rateLimiter: ContactRateLimiter
}

export function createApp(dependencies: AppDependencies) {
  const app = new Hono()

  app.use(
    "*",
    jsxRenderer(({ children, ...metadata }) => (
      <SiteLayout {...(metadata as PageMetadata)}>{children}</SiteLayout>
    )),
  )

  app.get("/200", (c) => {
    c.header("Cache-Control", "no-store")
    return c.json({ status: "ok" })
  })
  app.get("/healthz", (c) => c.json({ status: "ok" }))
  app.get("/readyz", (c) => c.json({ status: "ready" }))

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
