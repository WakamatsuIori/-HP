# 07. Discord →カレンダー連携（`/予定` コマンド）

Discordで `/予定` と打つだけで、配信予定がGoogleカレンダーに入り、HPの週間ボードに自動で反映される仕組みのセットアップ手順です。

## 全体の流れ（仕組み）

```
Discordで /予定 と入力
   │  月・日・タイトル・時間・プラットフォーム・おすすめ を選んで送信
   ▼
確認カード（本人だけに表示）「📅 6/20(土) 21:00 … この内容で登録しますか？」
   │  ［✓ 確定して登録］を押す（［✕ やり直す］なら未登録）
   ▼
Cloudflare（HPと同じ場所）が受け取る … https://<あなたのサイト>/discord/interactions
   │  本人確認（署名＋ユーザーID）→ Googleカレンダーへ1件追加
   ▼
Googleカレンダー（HPが読んでいるのと同じカレンダー）
   ▼
HPの週間ボード（今週・来週）に自動反映（最大1時間）
```

- **書き込みは「追加」だけ**です（編集・削除・双方向同期はしません）。
- 間違えたときは、Googleカレンダーを直接開いて消す/直すのが確実です。
- **日付は手打ちをやめ、月・日を一覧から選ぶ方式**にしました（去年の日付になる等の打ち間違いを防止）。**年は自動**で、過ぎた月日は翌年として登録されます。
- 登録の前に**確認カード**が出ます。`✓ 確定して登録` を押すまでカレンダーには入りません。
- 時間で「**休業（お休み）**」を選ぶと、その日が休業表示になります（時間を選ばなければ 21:00 になります）。

---

## 用意するもの（先に集めておくと早いです）

このあとの手順で、次の値を**Cloudflareの環境変数**に入れます。**チャットやコードには貼らないでください。**

| 変数名 | 中身 | どこで取る |
|---|---|---|
| `DISCORD_PUBLIC_KEY` | Discordアプリの Public Key | パートB |
| `DISCORD_APP_ID` | Discordアプリの Application ID | パートB |
| `DISCORD_ALLOWED_USER_IDS` | コマンドを使える人のユーザーID | パートB |
| `GOOGLE_SA_EMAIL` | サービスアカウントのメール | パートA |
| `GOOGLE_SA_PRIVATE_KEY` | サービスアカウントの秘密鍵(PEM) | パートA |
| `GOOGLE_CALENDAR_ID` | 書き込み先カレンダーのID | パートA |

---

## パートA：Googleカレンダーに書き込む権限を用意する

### A-1. サービスアカウントを作る（ロボット用のアカウント）
1. [Google Cloud Console](https://console.cloud.google.com/) を開く（HP用に作ったプロジェクトでOK。無ければ新規作成）。
2. 上の検索窓で「**Google Calendar API**」を検索 →「**有効にする**」。
3. 左メニュー「APIとサービス」→「**認証情報**」→「**＋認証情報を作成**」→「**サービスアカウント**」。
4. 名前（例：`hp-calendar-writer`）を入れて作成。ロール（役割）は付けなくてOK →「完了」。
5. 作成したサービスアカウントをクリック →「**キー**」タブ →「**鍵を追加**」→「**新しい鍵を作成**」→ 形式 **JSON** →「作成」。
   - JSONファイルがダウンロードされます。**これは秘密の鍵です。人に渡さない・どこにも貼らない。**
6. JSONを開くと中に次の2つがあります（後で使う）:
   - `client_email`（例：`hp-calendar-writer@xxxx.iam.gserviceaccount.com`）→ `GOOGLE_SA_EMAIL`
   - `private_key`（`-----BEGIN PRIVATE KEY-----` で始まる長い文字列）→ `GOOGLE_SA_PRIVATE_KEY`

### A-2. カレンダーをサービスアカウントに「編集できる」共有
1. [Googleカレンダー](https://calendar.google.com/) を開く。
2. 左の「マイカレンダー」から、**HPが読んでいる配信予定カレンダー**にマウスを乗せ「︙」→「**設定と共有**」。
3. 「**特定のユーザーやグループと共有する**」→「ユーザーを追加」。
4. A-1の `client_email`（…iam.gserviceaccount.com）を貼り付け、権限を「**予定の変更権限**」にして送信。
5. 同じ設定画面の下の方「**カレンダーの統合**」にある「**カレンダーID**」をコピー → `GOOGLE_CALENDAR_ID`。
   - 末尾が `@group.calendar.google.com` のような形です（このカレンダーがHPの `ICS_URL` と同じものであることを確認）。

---

## パートB：Discordアプリを作る

### B-1. アプリ作成
1. [Discord Developer Portal](https://discord.com/developers/applications) →「**New Application**」→ 名前（例：`和香松庵スケジュール`）。
2. 「**General Information**」ページで:
   - **Application ID** をコピー → `DISCORD_APP_ID`
   - **Public Key** をコピー → `DISCORD_PUBLIC_KEY`

### B-2. Bot とトークン
1. 左メニュー「**Bot**」→「**Add Bot**」（必要なら）。
2. 「**Reset Token**」でトークンを表示 → コピー。**コマンド登録のときだけ使う秘密の値**です（`DISCORD_BOT_TOKEN`）。
   - これはCloudflareには入れません。後述の登録スクリプトを動かすときに一時的に使うだけです。
3. このBotを自分のサーバーに入れます。「**OAuth2**」→「**URL Generator**」で `applications.commands` にチェック → 生成URLを開いて自分のサーバーを選んで認可。

### B-3. 自分のユーザーIDとサーバーID
1. Discordアプリの「設定 → 詳細設定 →**開発者モード**」をON。
2. 自分のアイコンを右クリック →「**ユーザーIDをコピー**」→ `DISCORD_ALLOWED_USER_IDS`（複数人なら `123,456` のようにカンマ区切り）。
3. サーバー名を右クリック →「**サーバーIDをコピー**」→ あとで使う `DISCORD_GUILD_ID`（即時反映用・任意）。

---

## パートC：Cloudflareに値を設定する

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → Pages → このHPのプロジェクト →「**Settings**」→「**Environment variables**」。
2. **Production** に次を追加（値は上で集めたもの。`GOOGLE_SA_PRIVATE_KEY` はJSONの `private_key` をそのまま貼り付け）:
   - `DISCORD_PUBLIC_KEY`
   - `DISCORD_APP_ID`
   - `DISCORD_ALLOWED_USER_IDS`
   - `GOOGLE_SA_EMAIL`
   - `GOOGLE_SA_PRIVATE_KEY`
   - `GOOGLE_CALENDAR_ID`
   - 秘密にあたるもの（鍵・トークン）は「**Encrypt**」を押してSecret扱いにすると安心です。
3. （任意・推奨）書き込みの1日上限ガードを使うなら、KVを1つ用意してバインド:
   - Cloudflare →「Workers & Pages」→「**KV**」→「Create namespace」（例：`sched`）。
   - Pagesプロジェクトの「Settings → Functions → KV namespace bindings」で、変数名 `SCHED_KV` としてバインド。
   - 入れない場合でも動きます（その場合は「許可ユーザーのみ」が主なガードになります）。
4. 設定後、一度デプロイし直す（GitHubにpush、または再デプロイ）と反映されます。

---

## パートD：コマンドを登録する（最初の一度＋コマンドの中身を変えたとき）

> ⚠️ **コマンドの選択肢（月／日／時間など）を変えたら、この登録をやり直す必要があります。** 例：`/予定` を「日付の手打ち」から「月・日を選ぶ＋確認カード」に作り直したときなど。再実行で上書き更新されます（**デプロイの後**に行うこと）。

### 方法1：GitHubのボタンで登録（ターミナル不要・おすすめ）

最初に一度だけ、GitHubに2つのSecretを登録します（コピペするだけ）:

1. リポジトリの **Settings → Secrets and variables → Actions →「New repository secret」** を開く。
2. 次の2つを追加（名前は完全一致で）:
   - `DISCORD_APP_ID` … Discordアプリの Application ID（General Information ページ）
   - `DISCORD_BOT_TOKEN` … Bot のトークン（Bot →「Reset Token」）。**秘密の値。GitHubのこのSecrets画面にだけ貼る**（チャットやコードに貼らない）。

以後はいつでも、**「Actions」タブ →「Discordコマンドを登録」→「Run workflow」** を押すだけで登録/更新できます。

- `guild_id` を空のまま実行 ＝ 全体（global）登録（反映まで最大1時間）。
- 特定サーバーに今すぐ反映したいときだけ、`guild_id` にサーバーIDを入れて実行（即時）。
- 緑のチェックが付き、ログに `✅ コマンドを登録しました` と出れば成功です。

### 方法2：自分のPC（PowerShell）で登録

ローカルで実行する場合。値は環境変数で渡すだけ＝**コードには残りません**。

PowerShell の例:
```powershell
$env:DISCORD_APP_ID="（Application ID）"
$env:DISCORD_BOT_TOKEN="（Bot Token）"
$env:DISCORD_GUILD_ID="（サーバーID。即時反映したいとき）"
node scripts/register-discord-commands.mjs
```
`✅ コマンドを登録しました` と出れば成功。Discordで `/予定` が使えるようになります。
（`DISCORD_GUILD_ID` を省くと全体登録になり、反映まで最大1時間ほどかかります。）

---

## パートE：Discordに受け口URLを教える

1. Developer Portal →「**General Information**」→「**Interactions Endpoint URL**」に次を入力:
   ```
   https://<あなたのサイト>/discord/interactions
   ```
   （独自ドメイン未取得なら `https://vtuber-hp.pages.dev/discord/interactions`）
2. 「Save Changes」。Discordがこのとき疎通確認（PING）をします。**パートCの設定とデプロイが先に済んでいないと検証に失敗**するので、その順番で進めてください。

---

## パートF：動作確認

1. Discordで次のように入力して送信（月・日・時間は一覧から選べます）:
   ```
   /予定  月:6  日:20  タイトル:雑談配信  時間:21:00
   ```
2. **確認カード**が自分だけに表示されます：「📅 **6/20(土) 21:00** ・ YouTube ／ この内容で登録しますか？」
   - 内容が合っていれば **［✓ 確定して登録］** を押す。
   - 違っていれば **［✕ やり直す］** を押す（カレンダーには入りません）。もう一度 `/予定` でやり直し。
3. 「✅ 配信予定を登録しました…」に変われば成功。Googleカレンダーの6/20に予定が入っています。
4. HPの週間ボードには次回更新（最大1時間）で反映されます。すぐ見たい場合は `/更新` か再デプロイ。

### 休業日（お休み）を入れたいとき
```
/予定  月:6  日:17  タイトル:お休み  時間:休業（お休み）
```
時間で「休業（お休み）」を選ぶと、その日が「休業」表示になります。
（※予定を何も入れない日も自動で「休業」表示になるので、明示したいときだけでOKです。）

---

## うまくいかないとき
- **Interactions Endpoint URLの検証に失敗する** → パートCの環境変数（特に `DISCORD_PUBLIC_KEY`）とデプロイ完了を確認。URLの末尾が `/discord/interactions` か確認。
- **「権限がありません」と返る** → `DISCORD_ALLOWED_USER_IDS` に自分のユーザーIDが入っているか確認。
- **「登録に失敗しました」と返る** → カレンダーをサービスアカウントに「予定の変更権限」で共有したか、`GOOGLE_CALENDAR_ID` が正しいかを確認。
- **カレンダーに入ったのにHPに出ない** → 反映はビルド時（最大1時間ごと）。急ぐなら `/更新` か再デプロイ。`ICS_URL` と `GOOGLE_CALENDAR_ID` が同じカレンダーか確認。
