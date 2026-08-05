import type { Child } from "hono/jsx"
import type { PageMetadata } from "../page-metadata.js"
import { Footer } from "./Footer.js"
import { Header } from "./Header.js"

type SiteLayoutProps = PageMetadata & {
  children: Child
}

export function SiteLayout({
  children,
  page,
  title,
  description,
  robots,
  canonical,
  styles,
  social,
  jsonLd,
  skipLink,
}: SiteLayoutProps) {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content={robots} />
        <meta name="theme-color" content="#173d3a" />
        {canonical && <link rel="canonical" href={canonical} />}
        {social && (
          <>
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="横浜関内社労士オフィス" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={social.description} />
            <meta property="og:url" content={social.url} />
            <meta property="og:image" content="https://yokohama-kannai-sr.com/assets/og-image.jpg" />
            <meta property="og:image:type" content="image/jpeg" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="横浜港の帆船と横浜関内社労士オフィス" />
            <meta property="og:locale" content="ja_JP" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={social.twitterDescription ?? social.description} />
            <meta name="twitter:image" content="https://yokohama-kannai-sr.com/assets/og-image.jpg" />
            {social.twitterImageAlt && (
              <meta name="twitter:image:alt" content={social.twitterImageAlt} />
            )}
          </>
        )}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/assets/favicon-options/favicon-01-32.png"
        />
        {styles.map((href) => <link rel="stylesheet" href={href} />)}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        {page === "home" && (
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
        )}
      </head>
      <body>
        {skipLink && <a class="skip-link" href="#main">本文へ移動</a>}
        <Header page={page} />
        {children}
        <Footer page={page} />
        <script src="/js/script.js"></script>
      </body>
    </html>
  )
}
