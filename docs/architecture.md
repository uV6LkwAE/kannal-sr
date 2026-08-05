# LP Site Architecture

## Purpose

社労士オフィスのLPサイトを作り直す。通常のLPとしての情報掲載に加え、問い合わせ機能を実装する。

サイトは軽量かつ小規模なため、アプリケーション構成とインフラ構成はできるだけ単純に保つ。一方で、問い合わせ機能では個人情報を扱うため、セキュリティと運用リスクを考慮する。

## Requirements

- LPサイトを提供する
- 問い合わせフォームを提供する
- ホストOS上に直接アプリケーションをホスティングしない
- 既存の自宅Ubuntu Server環境を利用する
- 既存のk3s環境と共存する
- Cloudflare Tunnels経由で外部公開する
- コンテナレジストリは自宅NASを利用する
- GitHub ActionsでCI/CDを構築する

## Application Stack

- Runtime: Node.js 24 LTS
- Framework: Hono
- Language: TypeScript
- View: Hono JSXによるサーバーサイドHTML生成
- Styling: 通常CSS
- Contact API: Hono route
- Spam protection: Cloudflare Turnstile
- Mail delivery: Nodemailer + Gmail SMTP
- Database: 初期構成では利用しない

## Application Design

Honoを中心に、LPのHTML配信と問い合わせAPIを同一アプリケーションで扱う。

想定するディレクトリ構成:

```txt
src/
  app.tsx
  index.ts
  components/
    Header.tsx
    Footer.tsx
    SiteLayout.tsx
  pages/
    HomePage.tsx
    PrivacyPage.tsx
    NotFoundPage.tsx
  routes/
    pages.tsx
    api.ts
  contact/
    schema.ts
    types.ts
  config/
    env.ts
  services/
    turnstile.ts
    mailer.ts
    rate-limit.ts
public/
  assets/
  css/
  js/
  robots.txt
  sitemap.xml
old/
  index.html
  privacy.html
  404.html
  css/
  js/
Dockerfile.dev
Dockerfile.prod
package.json
tsconfig.json
```

問い合わせの基本フロー:

```txt
Contact Form
  -> POST /api/contact
  -> request size and Content-Type validation
  -> strict request validation
  -> Cloudflare Turnstile verification
  -> office notification via Gmail SMTP
  -> requester confirmation via Gmail SMTP
  -> response
```

問い合わせ内容は初期構成ではDBに保存しない。メール通知のみとする。個人情報をサーバ側に永続化しないことで、情報管理と漏えい時のリスクを小さくする。

将来的に問い合わせ履歴が必要になった場合は、PostgreSQLなどへの保存を追加する。その場合は、保存項目、保持期間、暗号化、アクセス制御、バックアップ方針を別途設計する。

## Contact Form Security

問い合わせ機能では以下を実装する。

- 必須項目チェック
- フロントエンドとバックエンドの双方で入力制約を検証
- メールアドレス形式と最大254文字の検証
- 本文を10文字以上、2000文字以下に制限
- 未定義プロパティの拒否
- 個人情報保護方針への同意をバックエンドでも必須化
- Cloudflare Turnstileによるbot対策
- Turnstile Siteverify APIによるサーバー側検証
- Cloudflare側のRate Limiting
- サーバ側の軽いIPベースRate Limiting
- 問い合わせの監査ログを保持しない
- ログに問い合わせ本文、メールアドレス、電話番号などの個人情報を出さない
- Gmail SMTP認証情報などの秘密情報はKubernetes Secretで管理する

## Infrastructure

既存の自宅Ubuntu Server上のk3sクラスタにデプロイする。ホストOS上にNode.jsプロセスや静的ファイル配信プロセスを直接置かない。

外部公開の流れ:

```txt
Browser
  -> Cloudflare
  -> Cloudflare Tunnel
  -> cloudflared Pod in k3s
  -> kannai-sr Service
  -> Hono App Pod
```

推奨するKubernetes構成:

- Namespace: `kannai-sr`
- Deployment: Honoアプリケーション
- Service: ClusterIP
- Ingress: 使用しない。cloudflaredからClusterIP Serviceへ直接転送
- Secret: Gmail SMTP認証情報、Turnstile secret key、事務所通知メールの宛先
- ConfigMap: Turnstile site key、検証対象hostnameなどの公開設定

既存サイトとはnamespace、Cloudflare Tunnel、Secretを分けて共存させる。

## Container Registry

コンテナレジストリは自宅NAS上に構築する。

想定:

- NAS上にDocker Registry互換のprivate registryを用意する
- k3sノードからNAS registryへpullできるようにする
- GitHub ActionsからNAS registryへpushできるようにする
- 認証を有効化する
- TLSを有効化する

GitHub Actionsから自宅NAS registryへpushするには、ネットワーク到達性を確保する必要がある。候補は以下。

- NAS registryをCloudflare Tunnelで公開し、認証とアクセス制御をかける
- GitHub Actions self-hosted runnerを自宅ネットワーク内に置く
- VPN経由でGitHub Actions runnerからNASへ到達させる

推奨は、運用を単純にするため、自宅ネットワーク内にGitHub Actions self-hosted runnerを置く構成。NAS registryをインターネットへ直接公開しなくて済む。

## CI/CD

GitHub ActionsでCI/CDを構築する。

想定フロー:

```txt
push to main
  -> install dependencies
  -> lint
  -> test
  -> build
  -> docker build -f Dockerfile.prod
  -> push image to NAS registry
  -> kubectl apply
  -> kubectl rollout status
```

推奨するActions実行場所:

- self-hosted runner on home network

理由:

- 自宅NAS registryへ安全に到達しやすい
- k3sクラスタへ直接deployしやすい
- NAS registryを外部公開しなくてよい

必要なGitHub Secrets:

- `REGISTRY_HOST`
- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`
- `KUBE_CONFIG` または self-hosted runner上のkubeconfig
- `APP_DOMAIN`

Kubernetes側で必要なSecret:

- `TURNSTILE_SECRET_KEY`
- `SMTP_USER`
- `SMTP_APP_PASSWORD`
- `CONTACT_TO_EMAIL`

## Deployment Strategy

初期段階では単一replicaでよい。

```txt
replicas: 1
```

問い合わせ機能を持つがDBを使わないため、アプリケーションPodはステートレスに保つ。

将来的に可用性を上げる場合は以下を検討する。

- replicasを2以上にする
- PodDisruptionBudgetを追加する
- readinessProbe / livenessProbeを追加する
- image tagをGit SHAに固定する
- rollback手順を整備する

## Open Decisions

- NAS registryの具体的な実装

## Initial Recommendation

初期構成は以下を推奨する。

```txt
Hono + TypeScript + Hono JSX
Docker
k3s namespace separation
dedicated cloudflared tunnel in k3s
Cloudflare Turnstile
Nodemailer + Gmail SMTP without database persistence
NAS private registry
GitHub Actions self-hosted runner
```
