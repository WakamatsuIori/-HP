# 手順書03: GitHubリポジトリを作り、秘密情報を登録する

所要時間: 約10分。手順書01・02・04を済ませてから行うとスムーズです。

## なぜ必要？

GitHubはコードの置き場所であると同時に、**15分ごとの自動ビルド（GitHub Actions）の実行場所**です。

## 手順

### 1. リポジトリ（コード置き場）を作る

1. [github.com](https://github.com/) にログイン → 右上の **＋** → **New repository**
2. Repository name: `vtuber-hp`
3. **Public を選択**（重要・下記参照）
4. 「Add a README file」などのチェックは**すべて外したまま**
5. **Create repository** をクリック

> **なぜPublic？** 15分ごとの自動ビルドは月3000回近く動きます。Publicリポジトリなら
> Actionsが完全無料ですが、Privateだと無料枠（月2,000分）を大幅に超えて課金が発生します。
> APIキーなどの秘密情報はコードに一切含まれていない（Secretsという金庫に入れる）ため、
> Publicでも安全な構成にしてあります。

### 2. 秘密情報（Secrets）を登録する

1. 作ったリポジトリのページで **Settings** タブ → 左メニュー **Secrets and variables** → **Actions**
2. **New repository secret** で、以下の4つを1つずつ登録：

| Name（正確にこの通り入力） | Secret（値） | 入手元 |
|---|---|---|
| `ICS_URL` | カレンダーの.ics公開URL | 手順書01 |
| `DISCORD_WEBHOOK_URL` | DiscordのWebhook URL | 手順書02 |
| `CLOUDFLARE_API_TOKEN` | CloudflareのAPIトークン | 手順書04 |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareのアカウントID | 手順書04 |

### 3. 完了したら

リポジトリのURL（`https://github.com/あなたのID/vtuber-hp`）をClaudeに伝えてください。
コードのアップロード（push）はClaude側で行います。
