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
}

export const notFoundMetadata: PageMetadata = {
  page: "not-found",
  title: "ページが見つかりません | 横浜関内社労士オフィス",
  description: "お探しのページは移動または削除された可能性があります。",
  robots: "noindex, follow",
  styles: ["/css/styles.css", "/css/error.css"],
}
