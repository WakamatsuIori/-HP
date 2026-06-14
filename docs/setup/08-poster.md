# 08. 週間ポスターの自動生成（画像をDiscordへ）

配信予定を **1枚絵（Full HD 1920×1080）のポスター画像**にして、Discordへ投稿する仕組みです。X(Twitter)などにそのまま貼れます。

## 仕組み（3つの出し方）

```
Googleカレンダー（配信予定）
        │  対象週を取り出してポスターHTMLに流し込み
        ▼
GitHub Actions が Chrome で撮影 → 1920×1080 PNG
        ▼
Discordのチャンネルへ画像を投稿
```

ポスターを作るきっかけは3つ：
1. **毎週日曜 18:00（自動）** … 翌週ぶんのポスターを自動で作って投稿
2. **GitHubの画面から手動** … ボタンで「今週／来週」を選んで実行（追加設定なしで使える）
3. **Discordで `/ポスター`** … `今週/来週` を選んで送信（事前にパートCの設定が必要）

> データはHPと同じカレンダーを見ます。なので `/予定` で入れた予定がそのままポスターにも反映されます。

---

## パートA：投稿先のDiscord Webhookを用意（まずこれ）

1. ポスターを投稿したいDiscordチャンネルの「**⚙️（チャンネルの編集）**」→「**連携サービス（Integrations）**」
2. 「**ウェブフック（Webhooks）**」→「**新しいウェブフック**」→ 名前（例：週間ポスター）を付ける
3. 「**ウェブフックURLをコピー**」
4. これは **GitHub Secrets** に入れます（次のパートB）。これは秘密なのでチャットには貼らないでください。

---

## パートB：GitHub Secrets に登録

1. GitHubのリポジトリ →「**Settings**」→「**Secrets and variables**」→「**Actions**」
2. 「**New repository secret**」で追加：
   - `DISCORD_POSTER_WEBHOOK_URL` … パートAでコピーしたWebhook URL
   - （`ICS_URL` は Phase 1 で設定済みのはず。無ければ同様に追加）
3. これで **日曜18時の自動**と **手動実行** が使えるようになります。

### ここまでで動作テスト（おすすめ）
1. リポジトリ →「**Actions**」タブ →「**weekly-poster**」を選ぶ
2. 右の「**Run workflow**」→ 週（今週/来週）を選んで実行
3. 1〜2分後、Discordのチャンネルにポスター画像が届けばOK 🎉

---

## パートC：Discordの `/ポスター` から起動できるようにする（任意）

Discordでコマンドを打って作りたい場合だけ設定します（パートBの「手動実行」で十分なら不要）。

### C-1. GitHubトークンを作る
1. GitHub →右上アイコン →「**Settings**」→「**Developer settings**」→「**Personal access tokens**」→「**Fine-grained tokens**」→「**Generate new token**」
2. 「**Repository access**」で「Only select repositories」→ このHPのリポジトリを選択
3. 「**Permissions**」→「Repository permissions」→「**Contents**」を「**Read and write**」に
4. 生成 → トークンをコピー（**一度しか表示されません**・秘密）

### C-2. Cloudflareに設定
Cloudflare Pages → プロジェクト →「Settings」→「Environment variables」→ Production に追加：
- `GITHUB_DISPATCH_TOKEN` … C-1のトークン（Encryptを押してSecretに）
- `GITHUB_REPO` … `owner/repo` の形（例：`WakamatsuIori/-HP`）

設定後に一度再デプロイ。

### C-3. `/ポスター` コマンドを登録（再登録）
コマンドが増えたので、登録スクリプトをもう一度実行します（`/予定` の時と同じ手順。docs/setup/07-discord-calendar.md パートD）：
```powershell
node scripts/register-discord-commands.mjs
```
（`/予定` と `/ポスター` の両方がまとめて登録されます）

### C-4. 使ってみる
Discordで：
```
/ポスター 週:来週
```
→「🛠️ 来週のポスター生成を開始しました…」と返り、1〜2分後にチャンネルへ画像が届きます。

---

## 補足・困ったとき
- **日曜18時ちょうどに来ない**：GitHubの無料枠の都合で数分ずれることがあります（仕様）。
- **画像が来ない／失敗通知が来る**：Actions の「weekly-poster」の最新ログを確認。多くは `ICS_URL` か Webhook の設定ミス。
- **立ち絵やデザインを変えたい**：ポスターの見た目は `scripts/poster/template.html`（CSS冒頭の `--char-w` などの変数）で調整できます。
- **来週の予定がまだ空のとき**：その週は全日「お休み」のポスターになります。`/予定` で埋めてから作り直してください。
