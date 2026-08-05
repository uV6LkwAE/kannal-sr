import type { PageName } from "../page-metadata.js"

type HeaderProps = {
  page: PageName
}

export function Header({ page }: HeaderProps) {
  const homePrefix = page === "home" ? "" : "/"

  return (
    <header class="site-header" data-header>
      <div class="header-inner">
        <a
          class="brand"
          href={page === "home" ? "#top" : "/"}
          aria-label="横浜関内社労士オフィス ホーム"
        >
          <img class="brand-mark" src="/assets/site-logo.png" alt="" width="42" height="42" />
          <span class="brand-copy">
            <strong>横浜関内社労士オフィス</strong>
            <small>YOKOHAMA KANNAI SR OFFICE</small>
          </span>
        </a>

        <button
          class="menu-button"
          type="button"
          aria-label="メニューを開く"
          aria-expanded="false"
          aria-controls="global-nav"
          data-menu-button
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav class="global-nav" id="global-nav" aria-label="メインナビゲーション" data-menu>
          <a href={`${homePrefix}#services`}>業務内容</a>
          <a href={`${homePrefix}#strengths`}>当事務所について</a>
          <a href={`${homePrefix}#representative`}>代表挨拶</a>
          <a href={`${homePrefix}#office`}>事務所概要</a>
          <a class="nav-contact" href={`${homePrefix}#contact`}>お問い合わせ</a>
        </nav>
      </div>
    </header>
  )
}
