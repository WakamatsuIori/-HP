# 自動化 実装ランブック（手を動かす順番）

> 母艦＝この手順の作成まで。**実装は vtuber-hp（メイン）**：プランモード→承認→実装→/code-review→停止。
> 仕様（何を作るか）＝[自動化_実装仕様_波1-3](自動化_実装仕様_波1-3.md)。これは「実在ファイルに紐づけた、やる順番＝How」。
> 原則：サーバーレス／AI不使用／**秘匿情報は環境変数（コード・リポジトリに書かない）**／全てJST。

---

## 0. 着手前に押さえる「実物とのズレ」（重要・2026-06-22 実構造調査で判明）

仕様書は一部“ゼロから新規”を前提にしていたが、実物は既にできている所がある。**作る前にここを読む**。

| 仕様の項目 | 実物の状態 | だから手順はこう変わる |
|---|---|---|
| **A2 最新動画（RSS）** | `src/lib/loadVideos.ts` が**毎ビルドでYouTube APIから最新12件取得済み**。表示も実装済 | ゼロ新規ではない。RSSは「**取得失敗時のフォールバック源**」or「クォータ節約」として足す位置づけ（§A2参照）。**やらなくても表示は既に動く** |
| **D1 失敗通知** | `build.yml` が**ビルド失敗時にDiscord通知**済（連続失敗で@everyone）。ただし動画取得失敗＝**ビルドごと落ちる**設計 | D1の本体は「落とさず前回値で続行＋通知」への作り替え＝**鮮度フォールバック改修とセット**（§D1参照） |
| **E1 Web Analytics** | `PUBLIC_GA4_ID`（Google Analytics 4）が**既に配線済み** | Cloudflare版を足すと二重計測。**E1は不要**（GA4をそのまま使う）。波1から外す |
| **0-2 確認プレビュー** | `/予定` が**確認→確定の2分割フロー**で実装済（`functions/discord/interactions.ts`） | B3/B4はこれを**そのまま流用**。新規設計不要 |
| **0-1 Discord Webhook送信** | `build.yml` が `DISCORD_WEBHOOK_URL` で通知済（CI側） | Pages Function側からも投げる小ヘルパは新規（§C2の中で作る） |

**結論（波1の組み替え）**：E1は不要。A2/D1は鮮度レイヤー改修の一部。**波1の主役＝C2 お仕事依頼フォーム→Discord（完全新規・`work.astro`の穴を埋める・事業価値最大）**。

---

## 既存パターンの地図（真似る元）

| やりたいこと | 真似る既存ファイル | 形 |
|---|---|---|
| ビルド時に外部fetch | `src/lib/loadVideos.ts`／`loadSchedule.ts` | `src/lib/fetcher.ts`の`fetchText/fetchJson`（timeout15s）→純関数でパース（`youtube.ts`/`ics.ts`） |
| エッジでPOST受け | `functions/api/live.ts`（GET）／`functions/discord/interactions.ts`（POST） | `onRequestPost()`／WebCryptoのみ（Node API不可） |
| Discordコマンド確認フロー | `functions/discord/interactions.ts` の `/予定` | 署名検証→権限(`DISCORD_ALLOWED_USER_IDS`)→確認返信→`custom_id`で確定 |
| 再ビルド起動 | `interactions.ts` L324（make-poster）／`/更新` | `POST api.github.com/repos/{repo}/dispatches`（`GITHUB_DISPATCH_TOKEN`） |
| 設定データ | `src/config/information.ts`（お知らせ）／`src/config/featured.ts`（PICK UP） | TS配列をexport |
| 環境変数(Function) | Cloudflare Pages > Settings > Env Vars（Secret） | `import.meta.env` or 引数受け取り |

依存：`astro@6` / `node-ical` / `sharp`。**astro-embed・wranglerは無し**（YouTube埋め込みは自前コンポーネント）。Node>=24。

---

# 波1 — まずこれ

## ステップ1：C2 お仕事依頼フォーム → Discord（主役・完全新規）

**狙い**：`work.astro`（今19行の骨格）に依頼フォームを置き、送信を**保存せずDiscordに流す**（DB/メール不要・プライバシー良好）。

### 1-A. フロント（フォーム設置）
触る：`src/pages/work.astro`（＋必要なら `src/components/ContactForm.astro` 新規）
1. フォーム項目：`お名前/活動名`(必須)・`連絡先`(メール or X 必須)・`依頼種別`(select：コラボ/案件/取材/その他)・`内容`(textarea必須)・`予算感`(任意)・`希望時期`(任意)。
2. **スパム対策2点**を必ず入れる：
   - **honeypot**：画面に出さない入力（CSSで隠す）。埋まってたらサーバが黙って捨てる。
   - **Cloudflare Turnstile**：`<script>`ウィジェット＋サイトキー。送信時にtokenを一緒に送る。
3. a11y：本物の`<label>`・必須印・`aria-live`で送信結果。送信先＝`POST /api/contact`、本文に `kind=work`。
4. フォーム下に一言：「内容はDiscordに通知されます」。

### 1-B. エッジ関数（受け口）
触る：`functions/api/contact.ts`（新規）。真似る＝`functions/api/live.ts`の`onRequest`形＋`interactions.ts`の検証作法。
1. `onRequestPost`で受ける。**WebCryptoのみ**（Node不可）。
2. 処理順：
   1. honeypotが空か確認 → 埋まってたら`200 {ok:true}`で握りつぶし（攻撃者に気づかせない）。
   2. Turnstile検証：`POST https://challenges.cloudflare.com/turnstile/v0/siteverify`（`TURNSTILE_SECRET`＋token＋接続IP）→不合格は`400`。
   3. 入力バリデーション（必須・長さ上限・メール形式ゆるめ）。
   4. **Discord Webhelper**（この関数内に小さく書く）：`fetch(env.DISCORD_WEBHOOK_FORM,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({embeds:[{title:'お仕事依頼',fields:[…],timestamp}]})})`。
   5. 成功→`{ok:true}`／失敗→`{ok:false}`（フロントで再送案内）。
3. **保存しない**（Discordに流すだけ）。

### 1-C. 環境変数の登録（クリック手順）
Cloudflare Dashboard > Pages > 該当プロジェクト > **Settings > Environment variables** に**Secret**で追加：
- `DISCORD_WEBHOOK_FORM`（Discord：チャンネル設定>連携サービス>ウェブフック で作ったURL）
- `TURNSTILE_SECRET`（Cloudflare > Turnstile でサイト作成→Secret Key）
- `TURNSTILE_SITEKEY`（同 Site Key・これは公開でOK→フロントに埋める。`PUBLIC_`接頭辞で渡すか直書き）
※ **コード・gitに直書き禁止**。ローカル確認は `.dev.vars` に置く（.gitignore済を確認）。

### 1-D. テスト（受け入れ条件）
- [ ] 正常送信 → Discordの該当チャンネルに着弾（埋め込み表示）
- [ ] honeypotを埋めて送信 → 何も起きない（Discord来ない・画面はエラー出さない）
- [ ] Turnstile未通過 → 弾かれる（400）
- [ ] 必須空・超長文 → フロントでエラー表示
- [ ] 送信失敗時に再送案内が出る
- [ ] `work.astro` に「お仕事の可否＋このフォーム」が並ぶ（[制作工程03 案件獲得型]）

> C1 お便りフォームは**この部品の使い回し**（項目を 名前任意/本文必須 にして `kind=otayori`、Discord埋め込みのtitleを「お便り」に）。波2で。

---

## ステップ2：A2 最新動画の堅牢化（鮮度フォールバック・任意で前倒し可）

**注意**：最新動画の取得・表示は`loadVideos.ts`で**既に動いている**。ここでやるのは「**APIが落ちてもサイトが白くならない**」堅牢化。D1とセット。

触る：`src/lib/loadVideos.ts`・`src/lib/fetcher.ts`・（新規）`src/data/latest-videos.json`
1. 取得成功時：結果を `src/data/latest-videos.json` に**スナップショット書き出し**（ビルド成果物としてコミット）。
2. 取得失敗時（throwせず）：前回の `latest-videos.json` を読んで**それで表示を続行**（ビルドを止めない）。
3. 表示に「最終確認：◯前」（**取得日**。公開日とは別表記。[鮮度04]）。
4. （任意）クォータ節約：1次取得を**YouTube RSS**（`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`・キー不要）にし、詳細が要る時だけAPI。RSSは`fetchText`→XMLパース（`yt:videoId`/`title`/`published`/サムネ`i.ytimg.com/vi/<id>/mqdefault.jpg`）。
- 受け入れ：キー/ネット遮断でも前回値で表示継続（白画面なし）／0件で固定文言／公開日と取得日が混ざらない。

---

## ステップ3：D1 取得失敗をDiscordに通知（ビルド時／A2と同時）

**注意**：`build.yml`は**ビルド失敗**は通知済。ここは「ビルドは成功・でも取得は失敗してフォールバックした」を拾う。
1. ステップ2でフォールバックが発動したら、フラグ or ログマーカを残す。
2. ビルド時（A2/schedule）でフォールバック発生 → `DISCORD_WEBHOOK_OPS` に1通：「⚠ YouTube取得に失敗、前回値で継続（M/D H:M JST）」。
3. `/api/live`（エッジ）側は**連続失敗カウントが要る**→KVカウンタ。N回(例3)連続で通知、成功でリセット（遷移時のみ＝スパム防止）。
4. 環境変数：`DISCORD_WEBHOOK_OPS`（運用チャンネル・FORMと分けると見やすい）。liveのKVはバインドが要る。
- 受け入れ：擬似失敗で1通だけ／復旧でカウンタ戻る／毎ビルド通知しない。

---

# 波2 — 運営がさらに楽

## ステップ4：C1 お便りフォーム
ステップ1の部品流用（§ステップ1末尾の注記どおり）。`kind=otayori`、項目＝名前任意/本文必須、Discord埋め込みtitle「お便り」。

## ステップ5：D1 残り（/api/live のKVカウンタ）
波1で入れ損ねた場合はここで。KVバインド名を決めて Cloudflare Pages の Functions 設定で紐付け。

---

# 波3 — Discordで運営完結を厚く

## ステップ6：B3 `/お知らせ` ・ B4 `/ピックアップ`

**真似る**：`/予定` の確認→確定2分割フロー（`functions/discord/interactions.ts`）＋権限`DISCORD_ALLOWED_USER_IDS`。
**設計の肝（要確認ポイント）**：`/予定`は確定時に**Googleカレンダーへ書く**が、B3/B4は**リポジトリの`src/config/*.ts`を書き換える**必要がある。書き込み手段を1つ決める：
- 案ア）**GitHub API でcommit**（`src/config/information.ts`/`featured.ts`を直更新）→ push が `build.yml`(push:main) を起動。`GITHUB_DISPATCH_TOKEN`に`contents:write`権限が要る。
- 案イ）データを**R2/KVに置きビルド時に読む**形へ`config`を移行→ `repository_dispatch(rebuild-site)` で再ビルド（[HP自動化_計画]の方式）。

1. コマンド定義を `scripts/register-discord-commands.mjs` に追加（既存に倣う）→ `register-commands.yml` を手動実行して登録。
2. `interactions.ts` にハンドラ追加：
   - **B3 `/お知らせ`**：options＝`タイトル`(必須)・`本文`(必須)・`画像URL`(任意)・`重要度/期間`(任意)。確認プレビュー→確定で`information.ts`に1件追記。
   - **B4 `/ピックアップ`**：options＝`動画URL`(必須・videoId抽出)・`ラベル`(任意)。確定で`featured.ts`の`featuredVideoIds`差し替え。※既存の目印方式 `FEATURED_MARK='#おすすめ'`(`src/lib/featured.ts`)との整合を確認（コマンドで上書きするのか、目印と併用か）。
3. 確定で上記の書き込み手段→再ビルド。
- 受け入れ：確定で反映＆再ビルド／やり直しで未保存／画像URL無しでも崩れない／既存表示が壊れない／オーナー以外は拒否。

---

## 環境変数まとめ（登録先つき・秘匿）

| 変数 | 用途 | 登録先 |
|---|---|---|
| `YOUTUBE_API_KEY` | 既存・動画取得 | GitHub Secrets（build.yml）＋`.env` |
| `ICS_URL` | 既存・予定 | 同上 |
| `CHANNEL_ID`(=site.youtubeChannelId) | A2 RSS | configに既存。RSS用に明示参照 |
| `DISCORD_WEBHOOK_FORM` | C1/C2 フォーム通知 | Cloudflare Pages Env(Secret) |
| `DISCORD_WEBHOOK_OPS` | D1 監視通知 | Cloudflare Pages Env(Secret)／or GitHub Secrets(ビルド時) |
| `TURNSTILE_SITEKEY`(公開) / `TURNSTILE_SECRET` | フォームのスパム対策 | sitekeyはフロント／secretはPages Env |
| `DISCORD_PUBLIC_KEY`/`DISCORD_ALLOWED_USER_IDS` | 既存・コマンド検証/権限 | Pages Env |
| `GITHUB_DISPATCH_TOKEN`/`GITHUB_REPO` | 既存・再ビルド/B3B4書込 | Pages Env（B3B4はcontents:write要確認） |

---

## 実装順・全体の受け入れ

**波1**：① **C2 依頼フォーム**（主役・新規） → ②③ **A2堅牢化＋D1ビルド通知**（鮮度の信頼性／鮮度レイヤー改修と一体）。〔E1は不要・A2新規取得も不要と判明〕
**波2**：④ **C1 お便り**（C2流用） → ⑤ **D1の/api/live側KV**。
**波3**：⑥ **B3/B4**（/予定の確認フロー流用＋**config書込手段の決定**が肝）。

各共通：秘匿は環境変数のみ／失敗で本文・サイトが壊れない（フォールバック）／reduced-motion等a11y維持／通知がスパムにならない／オーナー権限チェック。

> **メインでの最初の一手**：`work.astro` に C2 フォーム＋`functions/api/contact.ts`＋Turnstile。これが事業の穴（案件導線）を一番埋める。A2/D1は鮮度レイヤー着手時に一緒に。
