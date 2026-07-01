# 手順書 10：お問い合わせフォーム（独自・黒×金）のセットアップ

## 概要
サイト独自の黒×金フォーム（`components/ContactForm.astro`）から送信された内容を、
サーバー機能（`functions/contact/submit.ts`）が受け取り、次の2つへ届けます。

- **Discord に通知**（専用チャンネルへ Webhook で即通知）
- **専用の Google スプレッドシートに記録**（1件1行で追記）

迷惑投稿・ボット対策は **Cloudflare Turnstile ＋ 隠しハニーポット ＋ 送信元チェック**。
Google フォームは使いません。

> このフォームが動くには、下の Step 1〜4 の「値」を Cloudflare Pages と GitHub に登録する必要があります。
> 登録が済むまで、フォームは「※ フォームは設定準備中です」と表示され、送信ボタンは押せません（安全側）。

---

## Step 1：記録用の Google スプレッドシートを用意する

1. https://sheets.google.com/ で新しいスプレッドシートを1つ作る（名前例：「お問い合わせ記録」）。
2. 1行目に見出しを入れておくと見やすい（任意）：`日時 / 用件 / お名前 / メール / 内容`
3. **サービスアカウントに共有する**（重要）：
   - 右上の「共有」→ 追加先に、カレンダー連携で使っている**サービスアカウントのメール**
     （`GOOGLE_SA_EMAIL` の値。`xxxx@xxxx.iam.gserviceaccount.com` の形）を入力し、
     権限を **「編集者」** にして共有。
4. **スプレッドシートIDを控える**：URLの `…/d/` と `/edit` の間の長い文字列。
   例：`https://docs.google.com/spreadsheets/d/`**`1AbCdEf....`**`/edit` → `1AbCdEf....`
5. **Sheets API を有効化**（初回のみ）：
   - Google Cloud Console → 対象プロジェクト → 「APIとサービス」→「ライブラリ」→
     「Google Sheets API」を検索して**有効化**。（カレンダー連携と同じプロジェクトでOK）

> メモした値 → **CONTACT_SHEET_ID**（Step 4で使う）

---

## Step 2：Discord の通知先（Webhook）を作る

1. 通知を受け取りたい Discord サーバーで、専用チャンネル（例：`#お問い合わせ`）を作る。
2. そのチャンネルの「⚙ 編集」→「連携サービス」→「ウェブフック」→「新しいウェブフック」。
3. 名前を付けて（例：「お問い合わせ」）、**「ウェブフックURLをコピー」**。

> コピーした値 → **CONTACT_WEBHOOK_URL**（Step 4で使う）
> ※このURLは秘密情報です。チャットに貼らないこと。

---

## Step 3：Cloudflare Turnstile のキーを発行する

1. Cloudflare ダッシュボード → 左メニュー「Turnstile」→「サイトを追加」。
2. 設定：
   - サイト名：任意（例：wakamatsu-iori）
   - ドメイン：`wakamatsu-iori.com`
   - ウィジェットモード：**Managed（推奨）**
3. 作成すると2つのキーが出る：
   - **サイトキー**（Site Key・公開）→ **PUBLIC_TURNSTILE_SITE_KEY**
   - **シークレットキー**（Secret Key・非公開）→ **TURNSTILE_SECRET_KEY**

---

## Step 4：値を登録する（2箇所）

### ① Cloudflare Pages の環境変数（フォーム受信の実行時に使う）
Cloudflare ダッシュボード → Pages → プロジェクト **wakamatsu-iori-hp** → 「設定」→「環境変数」→
**Production** に以下を追加（**Secret** として）：

| 変数名 | 値 |
|---|---|
| `CONTACT_WEBHOOK_URL` | Step 2 の Discord Webhook URL |
| `CONTACT_SHEET_ID` | Step 1 のスプレッドシートID |
| `TURNSTILE_SECRET_KEY` | Step 3 のシークレットキー |

> `GOOGLE_SA_EMAIL` / `GOOGLE_SA_PRIVATE_KEY` はカレンダー連携で設定済みならそのまま流用されます（未設定なら手順書07を参照）。

### ② GitHub Secrets（ビルド時にHTMLへ埋め込む公開キー）
GitHub リポジトリ → Settings →「Secrets and variables」→「Actions」→「New repository secret」：

| 名前 | 値 |
|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | Step 3 のサイトキー（公開値） |

---

## Step 5：反映（再ビルド）と動作確認

1. `PUBLIC_TURNSTILE_SITE_KEY` を入れたら、サイトを一度**再ビルド**する
   （`main` へ何か push するか、GitHub Actions の build-and-deploy を手動実行、または Discord の `/更新`）。
2. 公開後、`/work` または トップの「お問い合わせ」で：
   - Turnstile の確認ウィジェットが表示され、送信ボタンが押せるようになる
   - テスト送信 → 画面に「お問い合わせありがとうございました」
   - **Discord の専用チャンネルに通知が届く** ＆ **スプレッドシートに1行増える**
3. うまくいかない時：
   - 「準備中」のまま → `PUBLIC_TURNSTILE_SITE_KEY` 未反映（再ビルド待ち／Secret名の綴り）
   - 「確認に失敗しました」→ `TURNSTILE_SECRET_KEY` が未設定/誤り（Pages環境変数）
   - Discordだけ来てSheetに書かれない → スプレッドシートをサービスアカウントに「編集者」で共有したか／Sheets API有効化を確認

---

## 補足（仕組み）
- フォーム送信 → `POST /contact/submit`（Cloudflare Pages Function）。
- 受信側で **①ハニーポット → ②Turnstile検証 → ③入力チェック** の順に弾き、通過分だけ Discord と Sheets へ。
- **どちらか一方でも届けば「送信成功」**として扱い、取りこぼしを防ぎます。
- 秘密情報（Webhook・シークレット・SA鍵）は**すべて環境変数**。コードには含めません（CLAUDE.md §3）。
- スプレッドシートの列順：**日時 / 用件 / お名前 / メール / 内容**。
