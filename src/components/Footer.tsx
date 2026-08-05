import type { PageName } from "../page-metadata.js"

type FooterProps = {
  page: PageName
}

export function Footer({ page }: FooterProps) {
  const homePrefix = page === "home" ? "" : "/"

  return (
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img class="brand-mark" src="/assets/site-logo.png" alt="" width="42" height="42" />
          <div>
            <strong>横浜関内社労士オフィス</strong>
            <p>〒231-0062 横浜市中区桜木町1丁目101番地1 クロスゲート7階</p>
          </div>
        </div>
        <div class="footer-links">
          <a href={`${homePrefix}#services`}>業務内容</a>
          <a href={`${homePrefix}#office`}>事務所概要</a>
          <a href="/privacy" aria-current={page === "privacy" ? "page" : undefined}>
            個人情報保護方針
          </a>
          <a href={`${homePrefix}#contact`}>お問い合わせ</a>
        </div>
        <p class="copyright"><small>© 横浜関内社労士オフィス</small></p>
      </div>
    </footer>
  )
}
