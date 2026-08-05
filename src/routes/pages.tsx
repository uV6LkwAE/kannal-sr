import { Hono } from "hono"
import { homeMetadata, privacyMetadata } from "../page-metadata.js"
import { HomePage } from "../pages/HomePage.js"
import { PrivacyPage } from "../pages/PrivacyPage.js"

const redirects = new Map<string, string>([
  ["/index.html", "/"],
  ["/privacy.html", "/privacy"],
  ["/privacy/", "/privacy"],
  ["/privacy/index.html", "/privacy"],
])

export function createPageRoutes(turnstileSiteKey: string) {
  const pageRoutes = new Hono()

  pageRoutes.get("/", (c) => c.render(
    <HomePage turnstileSiteKey={turnstileSiteKey} />,
    homeMetadata,
  ))
  pageRoutes.get("/privacy", (c) => c.render(<PrivacyPage />, privacyMetadata))

  for (const [path, destination] of redirects) {
    pageRoutes.get(path, (c) => c.redirect(destination, 301))
  }

  return pageRoutes
}
