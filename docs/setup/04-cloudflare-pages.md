# 手順書04: Cloudflareアカウントを作り、APIトークンを発行する

所要時間: 約10分。

## なぜ必要？

HPの公開先（ホスティング）として Cloudflare Pages を使います。無料・SSL自動・高速です。
自動ビルド（GitHub Actions）からCloudflareへサイトを届けるための「鍵」＝APIトークンを発行します。

## 手順

### 1. Cloudflareアカウントを作る

1. [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) でアカウント作成（無料プランのままでOK）
2. メール認証を済ませてダッシュボードにログイン

### 2. アカウントIDを控える

1. ダッシュボード右上のプロフィールアイコン → **My Profile** ではなく、まずホーム画面へ
2. 左メニューの一番下あたり、またはホーム右側に **Account ID（アカウントID）** が表示されています
   （見つからない場合：左メニュー **Workers & Pages** を開くと右側に表示されます）
3. **Click to copy** でコピーし、メモ帳に一時保管 → 後でGitHub Secretsの `CLOUDFLARE_ACCOUNT_ID` に登録

### 3. APIトークンを発行する

1. 右上のプロフィールアイコン → **My Profile** → 左メニュー **API Tokens**
2. **Create Token** をクリック
3. 一番下の **Custom token** の **Get started** を選択
4. 以下のとおり設定：
   - Token name: `vtuber-hp-deploy`
   - Permissions: **Account** ／ **Cloudflare Pages** ／ **Edit** （この1行だけでOK）
5. **Continue to summary** → **Create Token**
6. 表示されたトークンを **この画面でしかコピーできない** ので必ずコピー → メモ帳に一時保管
   → 後でGitHub Secretsの `CLOUDFLARE_API_TOKEN` に登録

## ⚠️ 重要な注意

- APIトークンは秘密情報です。GitHub Secrets（と必要時のローカル `.env`）以外に保存しないでください
- 万一漏れた場合は API Tokens 画面から該当トークンを **Roll**（再発行）または **Delete** すれば無効化できます

### 4. 完了したら

Pagesのプロジェクト作成と初回デプロイはClaude側で行います。
4つのSecrets登録（手順書03）が済んだら、Claudeに「セットアップ完了」と伝えてください。
