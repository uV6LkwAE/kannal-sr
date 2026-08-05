export function NotFoundPage() {
  return (
    <main class="error-main" id="main">
          <div class="error-content">
            <p class="error-code" aria-hidden="true">404</p>
            <h1>ページが見つかりません</h1>
            <p>URLをご確認いただくか、トップページから目的の情報をお探しください。</p>
            <a class="button button-primary" href="/">トップページへ戻る</a>
          </div>
        </main>
  )
}
