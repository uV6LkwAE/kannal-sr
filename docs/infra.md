# Infrastructure

## 1. 目的

横浜関内社労士オフィスのLPサイトと問い合わせAPIを、自宅Ubuntu Server上のDockerホストで運用する。

小規模なサイトであるため構成は単純に保ちつつ、次の要件を満たす。

- ホストOS上へアプリケーションを直接配置しない
- 既存サイトとTunnel、Secretを分離する
- インターネットからDockerホストへポートを直接公開しない
- GitHub Actionsから安全かつ容易に更新できるようにする
- 問い合わせで扱う個人情報を不要に保存、記録しない

## 2. 採用構成

### Application

- Runtime: Node.js 24 LTS
- Framework: Hono
- Language: TypeScript
- Frontend: HTML、通常CSS、JavaScript
- Contact API: Hono
- Runtime validation: Zod
- Spam protection: Cloudflare Turnstile
- Mail delivery: Gmail SMTP via Nodemailer
- Database: 初期構成では使用しない

### Libraries

本番実行に必要な依存関係:

| Package | 役割 |
| --- | --- |
| `hono` | ルーティング、middleware、HTTP response |
| `@hono/node-server` | HonoをNode.jsのHTTP serverとして起動 |
| `zod` | 問い合わせリクエストの実行時validation |
| `@hono/zod-validator` | Zod schemaをHono middlewareとして利用 |
| `nodemailer` | Gmail SMTPを使用した問い合わせメール送信 |

```sh
npm install hono @hono/node-server zod @hono/zod-validator nodemailer
```

開発とCIで使用する依存関係:

| Package | 役割 |
| --- | --- |
| `typescript` | 型チェックとJavaScriptへのbuild |
| `@types/node` | Node.js APIの型定義 |
| `tsx` | ローカル開発時のTypeScript実行とwatch |
| `vitest` | Hono route、validation、問い合わせ処理のtest |
| `eslint` | 静的解析 |
| `typescript-eslint` | ESLintでTypeScriptを解析 |
| `@types/nodemailer` | NodemailerのTypeScript型定義 |

```sh
npm install --save-dev typescript @types/node tsx vitest eslint typescript-eslint @types/nodemailer
```

メール送信にはGmail専用SDKやGmail APIを使用せず、NodemailerからSMTP over TLSでGmailへ接続する。問い合わせ受付時は、事務所への通知メールと問い合わせ者への受付メールの両方を送信する。Turnstileのサーバー側検証にはNode.js標準の`fetch`を使用し、専用SDKは追加しない。

Zod schemaを問い合わせデータの定義元とし、`z.infer`でTypeScript型を生成する。同一項目をZod schemaとTypeScriptの`type`へ二重定義しない。

フロントエンドのHTMLはHono JSXでコンポーネント化し、サーバー側で生成する。CSSとブラウザ用JavaScriptは静的ファイルとして配信する。React、Vite、CSS frameworkは使用しない。

### Infrastructure

- Host: 自宅Ubuntu Server
- Container runtime: Docker
- Container orchestration: なし
- Edge / DNS / TLS: Cloudflare
- Public access: 専用Cloudflare Tunnel
- Container image distribution: GitHub Actionsでホスト上へ直接デプロイ
- CI/CD: GitHub Actionsのself-hosted runner

### Build and Container Policy

TypeScriptはCIで型チェックし、JavaScriptへbuildしてから本番実行する。

```text
src/**/*.ts(x)
  -> tsc --noEmit
  -> test
  -> tsc
  -> dist/*.js
  -> node dist/index.js
```

Dockerfileは開発用の`Dockerfile.dev`と本番用の`Dockerfile.prod`に分ける。

- `Dockerfile.dev`: 開発依存関係を含み、`tsx watch`でHonoをホットリロードする
- `Dockerfile.prod`: Node.js 24 LTSをbase imageにしたmulti-stage buildを行う
- 本番runtime stageにはbuild済みの`dist`、静的ファイル、production dependenciesだけを配置する

Docker Composeは使用しない。

- アプリケーションコンテナはHonoの1種類だけである
- Databaseなどのローカル依存サービスがない
- `cloudflared`はホスト上のサービスとして管理する
- Composeなど別方式で構成を二重管理しない

ホスト側のファイルは役割ごとに分離する。

```text
src/       HonoのTypeScript、JSXページ、共通コンポーネント
public/    CSS、ブラウザ用JavaScript、画像、SEOファイル
old/       JSX移行前のHTML、CSS、JavaScript（配信・image buildの対象外）
docs/      設計書
root       Dockerfile、package、TypeScript、lintなどの設定ファイル
```

ローカル開発では、`Dockerfile.dev`からイメージを作成し、変更を即時反映する`src/`と`public/`だけをbind mountする。コンテナ内の`node_modules`や設定ファイルはマウントで上書きしない。

```sh
docker build -f Dockerfile.dev -t kannai-sr:dev .
docker run --rm -it \
  -p 3000:3000 \
  --env-file .env \
  --mount type=bind,source="$PWD/src",target=/app/src \
  --mount type=bind,source="$PWD/public",target=/app/public \
  kannai-sr:dev
```

`src`と、それがimportするTypeScript/TSXファイルの変更を`tsx watch`が検知し、Honoプロセスを自動再起動する。`public/`のCSSとブラウザ用JavaScriptも追加の監視対象とする。bind mountにより静的ファイルの変更もコンテナへ即時反映される。ブラウザ画面の自動更新は行わないため、表示確認時はブラウザを更新する。

`package.json`、`package-lock.json`、`tsconfig.json`、`eslint.config.js`、`Dockerfile.dev`を変更した場合は、開発イメージを再buildする。

本番イメージは次のようにbuildする。

```sh
docker build -f Dockerfile.prod -t kannai-sr:prod .
```

本番では`docker run`でコンテナを起動する。CIはイメージをビルドし、デプロイ先ホスト上でそのまま`docker run`を実行して更新する。`docker compose`は使用しない。

Honoコンテナはホストのloopbackにだけ公開し、`cloudflared`はホストサービスとして`http://127.0.0.1:3000`へ転送する。

## 3. 通信経路

```text
Browser
  |
  | HTTPS
  v
Cloudflare Edge
  |  DNS / TLS termination / WAF / Rate Limiting
  v
Dedicated Cloudflare Tunnel: kannai-sr
  |
  v
cloudflared on Docker host
  |
  | http://127.0.0.1:3000
  v
Hono container
  |
  v
Ready Hono process
```

Cloudflare TunnelはIP直指定ではなく、ホスト上の`cloudflared`サービスが`http://127.0.0.1:3000`へ接続する。Honoコンテナはホストのloopbackにだけ公開するため、外部から直接到達できない。

## 4. 既存サイトとの分離

既存サイトとは以下を分離する。

- Cloudflare Tunnel
- Tunnel token
- `cloudflared` runtime
- Hono Docker container
- runtime secret
- GitHub Actionsのデプロイ権限
- コンテナイメージ名

Cloudflareはアプリケーションの内部構成を認識しない。専用Tunnelのトークンを持つ`cloudflared`が、同じホスト上のHonoコンテナへ転送することで経路を分離する。

## 5. Docker構成

初期構成では以下の構成要素を用意する。

```text
container/hono
```

### Hono container

- コンテナは`0.0.0.0:3000`でlistenする
- Git SHAをイメージタグに使用する
- `latest`タグをデプロイに使用しない
- `SIGTERM`を受けて正常終了できるようにする
- `/healthz`を起動確認に使用する
- CPU、メモリの上限はホスト運用に合わせて設定する

初期値の目安:

```yaml
resources:
  requests:
    cpu: 25m
    memory: 64Mi
  limits:
    cpu: 250m
    memory: 256Mi
```

実測値を確認して調整する。

### cloudflared runtime

- ホストへ直接インストールしたサービスとして管理する
- LP専用Tunnelのトークンを使用する
- 転送先は`http://127.0.0.1:3000`
- Tunnel tokenはGitHub Secretまたはホスト上のSecret管理から渡す
- トークンのローテーション手順を用意する

Honoコンテナと`cloudflared`サービスは小規模運用として1インスタンスから開始する。必要になった場合は冗長化を検討するが、当面は単一ホスト運用でよい。

## 6. コンテナのセキュリティ

Honoコンテナと`cloudflared`サービスには、可能な範囲で以下を設定する。

- 非rootユーザーで実行
- `allowPrivilegeEscalation: false`
- `readOnlyRootFilesystem: true`
- Linux capabilitiesをすべてdrop
- `seccompProfile: RuntimeDefault`

### HTTP Security Headers

Webサイト全体の安全性を高めるため、アプリケーションは以下のHTTPセキュリティヘッダーを返す。

必須:

| Header | 値 | 目的 |
| --- | --- | --- |
| `Content-Security-Policy` | `default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com https://www.google.com https://maps.google.com` | XSS、外部リソース読み込み、埋め込み元を制限する |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS固定を強制する |
| `X-Content-Type-Options` | `nosniff` | MIME sniffingを防ぐ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 参照元URLの漏えいを抑える |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | 不要なブラウザ機能の利用を抑える |

追加検討:

| Header | 推奨値 | 補足 |
| --- | --- | --- |
| `Cross-Origin-Opener-Policy` | `same-origin` | ウィンドウ分離を強める。外部連携との互換性を確認してから導入する |
| `Cross-Origin-Resource-Policy` | `same-origin` | 同一オリジン以外からの参照を抑える |

採用しない:

- `X-Frame-Options`
  - `Content-Security-Policy` の `frame-ancestors 'none'` で代替するため、重複導入しない
- `Cross-Origin-Embedder-Policy`
  - 外部スクリプトや埋め込みとの互換性影響が大きいため、現時点では採用しない
- 不要な秘密情報をコンテナイメージへ含めない
- ホストの永続ディレクトリへ問い合わせ本文や個人情報を保存しない

## 7. Cloudflare設定

本番ドメイン:

```text
yokohama-kannai-sr.com
```

設定項目:

- LP専用Cloudflare Tunnelを作成する
- Tunnelに本番hostnameを割り当てる
- Cloudflare EdgeでTLSを終端する
- Always Use HTTPSを有効にする
- `/api/contact`をキャッシュ対象外にする
- CSS、JavaScript、画像などの静的ファイルを適切にキャッシュする
- `/api/contact`にRate Limitingを設定する
- 必要に応じてWAFルールを設定する

オリジンはTunnel経由でのみ到達可能にする。クライアントIPを利用する場合は`CF-Connecting-IP`を参照し、オリジンがTunnel以外から到達できない状態を維持する。

## 8. 問い合わせAPI

問い合わせ処理:

```text
POST /api/contact
  -> Content-Typeとrequest body sizeの検証
  -> Zodで入力値の形式、長さ、必須項目を検証
  -> Turnstileのサーバー側検証
  -> Nodemailerから事務所通知メールをGmail SMTPへ送信
  -> Nodemailerから問い合わせ者向け受付メールをGmail SMTPへ送信
  -> 成功またはエラーレスポンス
```

実装要件:

- Turnstileはブラウザ側だけでなくサーバー側でも検証する
- Turnstile検証に成功した有効なトークンがない場合はメール送信処理を実行しない
- Turnstileの検証結果について、想定するhostnameとactionを確認する
- リクエストの`Content-Type`を`application/json`に限定する
- リクエスト本文の最大サイズを16 KiBに制限する
- Zod schemaは`strict`とし、未定義のプロパティを拒否する
- 氏名、会社名、メールアドレス、電話番号、本文の最大文字数を設定する
- メールアドレスは一般的な形式と最大254文字を検証する
- 個人情報保護方針への同意値は`true`のみ受け付ける
- 相談内容種別は定義済みの値だけを受け付ける
- 短文項目の改行文字を拒否し、メールヘッダーインジェクションを防止する
- Gmail SMTPへの接続、socket、送信処理にタイムアウトを設定する
- 必要最小限の再試行に限定する
- Cloudflare側とアプリケーション側でRate Limitを設ける
- honeypotフィールドの追加を検討する
- 問い合わせ処理の成功・失敗を記録する監査ログは実装しない
- 問い合わせ本文、連絡先、Turnstileトークン、request bodyをログへ出さない
- 問い合わせ内容をDBへ保存しない
- `From`はGmailで認証した事務所の固定アドレスを使用する
- フォーム入力者のメールアドレスは`Reply-To`に設定する
- 事務所通知と問い合わせ者向け受付メールの両方がSMTPサーバーに受理された場合だけ成功レスポンスを返す
- SMTP受理後の最終配達およびバウンスメールによる実在確認は処理対象外とする
- 成功・失敗の2種類のレスポンス形式を定義し、HTTP statusで失敗理由を区別する
- Googleアカウントの通常パスワードを使用しない
- 送信元ドメインのSPF、DKIM、DMARCを設定する
- 個人情報の利用目的と保持方針をprivacyページへ記載する

## 9. GitHub Secrets と Variables

GitHub Actionsでは、`deploy.yml` で使う値を必要最小限にする。`deploy.yml` は本番の`.env.prod`を読まず、workflow内で `docker run` の引数として明示的に渡す。

### ビルド工程で使うもの

現在はなし。`npm ci`、lint、typecheck、test、build は GitHub Secrets / Variables を必要としない。

### サービスを動かすのに使うもの

#### GitHub Secrets

| Key | ダミー値の例 | 用途 |
| --- | --- | --- |
| `TURNSTILE_SECRET_KEY` | `1x0000000000000000000000000000000AA` | Turnstile Siteverify の認証 |
| `SMTP_USER` | `sender@example.com` | Gmail SMTP のログイン識別子 |
| `SMTP_APP_PASSWORD` | `dummy-app-password-123456` | Gmail のアプリパスワード |
| `CONTACT_TO_EMAIL` | `office@example.com` | 問い合わせ通知の送付先 |

`SMTP_USER` と `CONTACT_TO_EMAIL` はサイト上へ公開する必要がないため Secret として扱う。
`cloudflared` のトンネルトークンは GitHub Secrets には置かず、ホスト上の systemd unit あるいは root-only の設定ファイルにのみ置く。これは初回セットアップとトークン再発行時だけ使う。

#### GitHub Variables

| Key | ダミー値の例 | 用途 |
| --- | --- | --- |
| `STATIC_ROOT` | `public` | 静的ファイルのルート |
| `TURNSTILE_SITE_KEY` | `1x00000000000000000000AA` | ブラウザへ埋め込む Turnstile 公開キー |
| `TURNSTILE_EXPECTED_HOSTNAME` | `yokohama-kannai-sr.com` | Siteverify 応答で照合する本番 hostname |

`STATIC_ROOT` は通常 `public` を指すだけなので Variables でよい。`TURNSTILE_SITE_KEY` と `TURNSTILE_EXPECTED_HOSTNAME` は公開値だが、workflow から渡しやすいなら Variables に置く。

### 混合

| Key | ダミー値の例 | 用途 |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | アプリの listen address と `docker run` への渡し先 |
| `PORT` | `3000` | アプリの listen port と `docker run` の公開ポート |

`HOST` と `PORT` は、アプリ本体とデプロイ workflow の両方で参照するため混合扱いにする。`APP_HEALTHCHECK_URL` は `PORT` から組み立てられるので不要。`DOCKER_IMAGE_NAME` と `DOCKER_CONTAINER_NAME` も固定値で十分なため不要。

SMTP接続先は現在の実装で`smtp.gmail.com:465`、TLS有効に固定する。Googleアカウントの通常パスワードは使用しない。

## 11. CI/CD

GitHub Actionsのself-hosted runnerをデプロイ先のDockerホスト上に配置する。外部公開する registry や管理API は使わない。

```text
push to main
  -> npm ci
  -> npm run lint
  -> npm run typecheck
  -> npm test
  -> npm run build
  -> container image build
  -> vulnerability scan
  -> docker stop 旧コンテナ
  -> docker rm 旧コンテナ
  -> docker run 新コンテナ
  -> smoke test
```

デプロイ要件:

- protectedな`main`ブランチからのみ本番デプロイする
- forkや信頼できないPull Requestのコードをself-hosted runnerで実行しない
- runnerをこのrepository専用にする
- `docker run` に渡す環境変数は GitHub Secrets / Variables から組み立てる
- コンテナ名とポートは固定して更新する
- デプロイの同時実行を防止する
- 失敗時に直前のコンテナへ戻せるようにする
- GitHubモバイルアプリに通知が届くよう、workflowの成功・失敗が一目で分かる構成にする
- 各フェーズは `name` と `echo` で明示し、失敗時は該当ステップがすぐ分かるようにする

補足:

- GitHubモバイルアプリへの通知は、基本的には workflow / job の完了状態に紐づく
- 個々のフェーズを別々のプッシュ通知にすることはできないため、ログ上のコメントとチェック結果で見分ける

## 12. 監視とログ

- 問い合わせの受付履歴、成功、失敗を記録する監査ログは保持しない
- 問い合わせ本文、会社名、氏名、メールアドレス、電話番号、Turnstileトークンを記録しない
- メール送信障害を検知して外部通知する仕組みは実装しない
- 起動失敗など、アプリケーション実行に必要な最小限のプロセスエラーは標準エラー出力へ出す

## 13. バックアップと復旧対象

アプリケーションはステートレスとし、問い合わせ内容は保存しない。

バックアップまたは再発行手順が必要なもの:

- Git repository
- deployment workflow
- Cloudflare Tunnel設定
- Tunnel token
- Turnstile secret
- Gmail SMTPの認証情報
- DNS設定
- self-hosted runnerとデプロイ権限の再構築手順

## 14. 実装順序

1. Honoアプリケーションと`/healthz`を実装する
2. `Dockerfile.dev`のホットリロードと`Dockerfile.prod`の非root実行を確認する
3. デプロイ先ホストにself-hosted runnerを設定する
4. 専用Cloudflare Tunnelと`cloudflared`の起動方式を決める
5. 本番hostnameをTunnelへ割り当てる
6. Turnstile、Nodemailer、Gmail SMTPのSecretsとVariablesを設定する
7. `deploy.yml` を実装して、ビルド、起動、ヘルスチェックまで通す
8. CI/CD、ロールバック、失敗時通知を検証する
9. Rate Limiting、監視、バックアップ、障害時手順を確認する

## 15. 未確定事項

- `deploy.yml` での `docker run` 引数の最終形
