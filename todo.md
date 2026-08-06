Google Search Consoleの google-site-verification 値（未取得なら「未取得」）

サムネイル用の画像用意
assetsの圧縮

## 残作業

- `typecheck` と `test` を再実行する（完了）
  - ただし現状のWSL環境ではDockerが使えないため、Docker DesktopのWSL integrationを有効にするか、別の実行環境で確認する
- HTTPセキュリティヘッダーの最終整合
  - `infra.md` に書いた方針と `app.tsx` の実装を一致させる
  - 特に `Strict-Transport-Security` を実装するか、設計書から外すかを決める
- CI/CDの `deploy.yaml` を実装する
  - self-hosted runner を実機に設定する
  - 実機上で `docker build` して、そのまま `docker run` で動かす
  - k3s 配置は行わない
  - 低負荷想定のため、外側のDockerホストで単純に運用する
  - まずは runner の接続確認と、デプロイ先ホストでのイメージ実行手順を固める
- ビルド後のクリーンアップ方針を入れる
  - 実機上でビルドするたびに溜まる一時ファイルや不要な生成物を掃除する
  - ただし前回ビルドのレイヤーは再利用してよいので、キャッシュは壊さない
- 実機上の Docker 実行方式を整理する
  - コンテナ名
  - ポート公開
  - 旧コンテナの停止と置換
  - ログの扱い
- Cloudflare Tunnel / Turnstile / SMTP の本番値を整理する
- `google-site-verification` の値を取得する
- サムネイル用画像を用意する
- assets を圧縮する
