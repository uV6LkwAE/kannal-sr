# Infrastructure

## 1. 目的

横浜関内社労士オフィスのLPサイトと問い合わせAPIを、自宅Ubuntu Server上の既存k3sクラスタで運用する。

小規模なサイトであるため構成は単純に保ちつつ、次の要件を満たす。

- ホストOS上へアプリケーションを直接配置しない
- 既存サイトとnamespace、Tunnel、Secretを分離する
- インターネットからk3sノードへポートを直接公開しない
- NASのprivate container registryを利用する
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
- Container orchestration: 既存k3sクラスタ
- Namespace: `kannai-sr`
- Edge / DNS / TLS: Cloudflare
- Public access: 専用Cloudflare Tunnel
- Container registry: 自宅NAS上のprivate registry
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
- `cloudflared`を含む本番コンテナの管理はk3sが行う
- ComposeとKubernetesで構成を二重管理しない

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

本番ではDocker Composeや`docker run`を使用しない。CIがイメージをNAS registryへpushし、k3sのcontainer runtimeがDeploymentの指定に従ってpull、実行する。

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
cloudflared Deployment in namespace kannai-sr
  |
  | http://hono:3000
  v
Hono ClusterIP Service
  |
  v
Ready Hono Pod
```

Cloudflare TunnelはPod IDやPod IPを直接指定しない。`cloudflared`からKubernetes ServiceのDNS名 `hono` を参照し、Serviceが正常なHono Podへ転送する。

Podは再作成時にIPが変わるため、転送先にPod IPを使用しない。

## 4. 既存サイトとの分離

既存サイトとは以下を分離する。

- Kubernetes namespace
- Cloudflare Tunnel
- Tunnel token
- `cloudflared` Deployment
- Kubernetes Service
- Kubernetes Secret
- GitHub Actionsのデプロイ権限
- コンテナイメージ名

CloudflareはKubernetes namespaceを認識しない。専用Tunnelのトークンを持つ`cloudflared`が、同じnamespaceのHono Serviceへ転送することで経路を分離する。

## 5. Kubernetesリソース

初期構成では以下のリソースを作成する。

```text
namespace/kannai-sr
deployment/hono
service/hono
deployment/cloudflared
secret/cloudflared-token
secret/app-secrets
secret/registry-credentials
configmap/app-config
serviceaccount/deployer
role/deployer
rolebinding/deployer
```

### Hono Deployment

- 初期replica数は`1`
- コンテナは`0.0.0.0:3000`でlistenする
- `RollingUpdate`を使用する
- `revisionHistoryLimit`を設定する
- Git SHAをイメージタグに使用する
- `latest`タグをデプロイに使用しない
- `SIGTERM`を受けて正常終了できるようにする
- `/healthz`をliveness probeに使用する
- `/readyz`をreadiness probeに使用する
- CPU、メモリのrequestsとlimitsを設定する

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

### Hono Service

- typeは`ClusterIP`
- Service名は`hono`
- Service portは`3000`
- `NodePort`と`LoadBalancer`は使用しない
- 外部から直接到達できる経路を作らない

### cloudflared Deployment

- LP専用Tunnelのトークンを使用する
- 転送先は`http://hono:3000`
- 初期replica数は`1`
- Tunnel tokenはKubernetes Secretから渡す
- トークンのローテーション手順を用意する

Honoと`cloudflared`は小規模運用として1 replicaから開始する。必要になった場合は2 replicasへ増やせるが、単一ノードクラスタではノード障害への耐性は得られない。

### Ingress

このサイトでは次を使用しない。

- Traefik Ingress
- Kubernetes Ingress
- Nginx reverse proxy

`cloudflared`からHonoのClusterIP Serviceへ直接転送する。

## 6. コンテナのセキュリティ

Hono Podと`cloudflared` Podには、可能な範囲で以下を設定する。

- 非rootユーザーで実行
- `allowPrivilegeEscalation: false`
- `readOnlyRootFilesystem: true`
- Linux capabilitiesをすべてdrop
- `seccompProfile: RuntimeDefault`
- 不要なServiceAccount tokenをマウントしない
- Secretをコンテナイメージへ含めない

NetworkPolicyはk3sで使用しているCNIの対応状況を確認してから導入する。導入する場合は、`cloudflared`からHonoへの通信と、HonoからDNS、Turnstile Siteverify API、Gmail SMTPへの必要な通信のみを許可する。

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

## 9. Secretと設定値

### Kubernetes Secret

想定する機密情報:

- `CLOUDFLARED_TOKEN`
- `TURNSTILE_SECRET_KEY`
- `SMTP_USER`
- `SMTP_APP_PASSWORD`
- `CONTACT_TO_EMAIL`
- NAS registryの認証情報

`SMTP_USER`はGmailのログイン識別子、`CONTACT_TO_EMAIL`は問い合わせ内容の送付先であり、サイト上へ公開する必要がないためSecretとして扱う。Secretの実値はGit、コンテナイメージ、Dockerfile、ConfigMapへ保存しない。Secret manifestを管理する場合はキー名のみを記載したexampleファイルにする。

ローカル開発ではGit管理対象外の`.env`へ保存し、`docker run --env-file .env`でコンテナへ渡す。`.env`はコンテナイメージへコピーしない。本番では`secret/app-secrets`から環境変数としてPodへ渡す。

```yaml
envFrom:
  - secretRef:
      name: app-secrets
```

### ConfigMap

機密ではない設定:

- `APP_ENV`
- `APP_ORIGIN`
- `PORT`
- `STATIC_ROOT`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_EXPECTED_HOSTNAME`

アプリケーションが現在読み取る環境変数:

| Key | 機密 | 用途 |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | いいえ | ブラウザへ埋め込むTurnstile公開キー |
| `TURNSTILE_EXPECTED_HOSTNAME` | いいえ | Siteverify応答で照合する本番hostname |
| `TURNSTILE_SECRET_KEY` | はい | Siteverify APIの認証 |
| `SMTP_USER` | はい | Gmail SMTPの認証ユーザー兼固定Fromアドレス |
| `SMTP_APP_PASSWORD` | はい | Gmailのアプリパスワード |
| `CONTACT_TO_EMAIL` | はい | 事務所向け通知メールの宛先 |
| `HOST` | いいえ | listen address。既定値`0.0.0.0` |
| `PORT` | いいえ | listen port。既定値`3000` |
| `STATIC_ROOT` | いいえ | 静的ファイルのルート。既定値`public` |

SMTP接続先は現在の実装で`smtp.gmail.com:465`、TLS有効に固定する。Googleアカウントの通常パスワードは使用しない。

## 10. NAS Container Registry

- Docker Registry互換のprivate registryを使用する
- NAS registryはインターネットへ直接公開しない
- k3sノードとself-hosted runnerからのみ到達可能にする
- 認証を有効にする
- 通信経路をTLSで保護する
- k3sには`imagePullSecret`を設定する
- 過去の正常なイメージを一定数保持する
- registryデータをバックアップする

NAS停止中も実行中のPodは継続できるが、新規pullが必要な再起動やデプロイは失敗する可能性がある。そのため、直前の正常イメージを保持し、NASの可用性と復旧手順を確認しておく。

## 11. CI/CD

GitHub Actionsのself-hosted runnerを自宅ネットワーク内に配置する。NAS registryやk3s APIを外部公開しない。

```text
push to main
  -> npm ci
  -> npm run lint
  -> npm run typecheck
  -> npm test
  -> npm run build
  -> container image build
  -> vulnerability scan
  -> NAS registryへGit SHA tagでpush
  -> deploymentのimageを更新
  -> kubectl rollout status
  -> smoke test
```

デプロイ要件:

- protectedな`main`ブランチからのみ本番デプロイする
- forkや信頼できないPull Requestのコードをself-hosted runnerで実行しない
- runnerをこのrepository専用にする
- registry資格情報をGitHub Actions Secretsで管理する
- Kubernetes権限を`kannai-sr` namespaceに限定する
- Deployment更新とrollout確認に必要な最小権限のみ付与する
- デプロイの同時実行を防止する
- 失敗時に直前のGit SHAタグへ戻せるようにする

ロールバック例:

```sh
kubectl -n kannai-sr rollout undo deployment/hono
kubectl -n kannai-sr rollout status deployment/hono
```

## 12. 監視とログ

- 問い合わせの受付履歴、成功、失敗を記録する監査ログは保持しない
- 問い合わせ本文、会社名、氏名、メールアドレス、電話番号、Turnstileトークンを記録しない
- メール送信障害を検知して外部通知する仕組みは実装しない
- `/200`はHonoプロセスがHTTP応答可能か確認するために提供する
- 起動失敗など、アプリケーション実行に必要な最小限のプロセスエラーは標準エラー出力へ出す

## 13. バックアップと復旧対象

アプリケーションはステートレスとし、問い合わせ内容は保存しない。

バックアップまたは再発行手順が必要なもの:

- Git repository
- Kubernetes manifests
- NAS registryデータ
- Cloudflare Tunnel設定
- Tunnel token
- Turnstile secret
- Gmail SMTPの認証情報
- DNS設定
- self-hosted runnerとデプロイ権限の再構築手順

## 14. 実装順序

1. Honoアプリケーションと`/healthz`、`/readyz`を実装する
2. `Dockerfile.dev`のホットリロードと`Dockerfile.prod`の非root実行を確認する
3. NAS registryと認証、TLS、バックアップを準備する
4. `kannai-sr` namespaceとHonoのDeployment、Serviceを作成する
5. 専用Cloudflare Tunnelと`cloudflared` Deploymentを作成する
6. 本番hostnameをTunnelへ割り当てる
7. Turnstile、Nodemailer、Gmail SMTPのSecretとConfigMapを設定する
8. GitHub Actionsのself-hosted runnerとnamespace限定権限を設定する
9. CI/CD、rollout確認、ロールバックを検証する
10. Rate Limiting、監視、バックアップ、障害時手順を確認する

## 15. 未確定事項

- NAS registryの製品または実装方式
- k3sで使用中のCNIとNetworkPolicy対応状況
