export type PageName = "home" | "privacy" | "not-found"

type SocialMetadata = {
  description: string
  url: string
  twitterDescription?: string
  twitterImageAlt?: string
}

export type PageMetadata = {
  page: PageName
  title: string
  description: string
  robots: string
  canonical?: string
  styles: string[]
  social?: SocialMetadata
  jsonLd?: object
  skipLink?: boolean
}

const siteUrl = "https://yokohama-kannai-sr.com"
const homeTitle = "横浜関内社労士オフィス | 横浜・桜木町の社会保険労務士"
const homeDescription =
  "横浜・桜木町の社会保険労務士。労働社会保険の手続き、労務管理相談、就業規則、行政調査対応まで、正確に、すばやく、親身に支援します。"

export const homeMetadata: PageMetadata = {
  page: "home",
  title: homeTitle,
  description: homeDescription,
  robots: "index, follow, max-image-preview:large",
  canonical: `${siteUrl}/`,
  styles: ["/css/styles.css"],
  skipLink: true,
  social: {
    description:
      "労働社会保険の手続き、労務管理相談、就業規則、行政調査対応まで、横浜・関内の企業労務を支援します。",
    twitterDescription:
      "労働社会保険の手続きから労務相談、行政調査対応まで、横浜・関内の企業労務を支援します。",
    twitterImageAlt: "横浜港の帆船と横浜関内社労士オフィス",
    url: `${siteUrl}/`,
  },
  jsonLd: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: "横浜関内社労士オフィス",
        inLanguage: "ja-JP",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": ["ProfessionalService", "LocalBusiness"],
        "@id": `${siteUrl}/#organization`,
        url: `${siteUrl}/`,
        name: "横浜関内社労士オフィス",
        description:
          "横浜・桜木町を拠点に、労働社会保険手続き、労務管理相談、就業規則、行政調査対応を行う社会保険労務士事務所です。",
        image: `${siteUrl}/assets/og-image.jpg`,
        logo: `${siteUrl}/assets/site-logo.png`,
        telephone: "+81-90-3232-3649",
        foundingDate: "1999-07",
        address: {
          "@type": "PostalAddress",
          postalCode: "231-0062",
          addressCountry: "JP",
          addressRegion: "神奈川県",
          addressLocality: "横浜市中区",
          streetAddress: "桜木町1丁目101番地1 クロスゲート7階",
        },
        areaServed: { "@type": "AdministrativeArea", name: "神奈川県" },
        knowsAbout: ["労働社会保険手続き", "労務管理相談", "就業規則", "行政調査対応"],
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: `${siteUrl}/`,
        name: homeTitle,
        description:
          "横浜・桜木町の社会保険労務士。労働社会保険の手続き、労務管理相談、就業規則、行政調査対応まで支援します。",
        inLanguage: "ja-JP",
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#organization` },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `${siteUrl}/assets/og-image.jpg`,
          width: 1200,
          height: 630,
        },
      },
    ],
  },
}

const privacyTitle = "個人情報保護方針 | 横浜関内社労士オフィス"
const privacyDescription =
  "横浜関内社労士オフィスの個人情報および特定個人情報等の取扱いに関する基本方針です。"

export const privacyMetadata: PageMetadata = {
  page: "privacy",
  title: privacyTitle,
  description: privacyDescription,
  robots: "index, follow, max-image-preview:large",
  canonical: `${siteUrl}/privacy`,
  styles: ["/css/styles.css", "/css/privacy.css"],
  social: {
    description: privacyDescription,
    url: `${siteUrl}/privacy`,
  },
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/privacy#webpage`,
    url: `${siteUrl}/privacy`,
    name: privacyTitle,
    description: privacyDescription,
    inLanguage: "ja-JP",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
  },
}

export const notFoundMetadata: PageMetadata = {
  page: "not-found",
  title: "ページが見つかりません | 横浜関内社労士オフィス",
  description: "お探しのページは移動または削除された可能性があります。",
  robots: "noindex, follow",
  styles: ["/css/styles.css", "/css/error.css"],
}
