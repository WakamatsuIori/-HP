# refactor-instructions.md

> 使い方: 実装担当モデルに「/goal refactor-instructions.md に書かれたことを完遂しろ」と渡す。
> このリポジトリ（`vtuber-hp`）の**既存仕様を壊さず、技術的負債を減らし、今後変更しやすくする**ための指示書。
> 「全部リファクタ」ではない。見た目の綺麗さは目的ではない。証拠（`file:line`）に基づき、小さく安全な単位で進める。

---

## Objective（目的）

既存の振る舞い（カレンダー連携・Discord連携・ポスター生成・LP表示）を**一切変えずに**、次を達成する:

1. 壊れやすい中核ロジックに**テストの安全網**を張る（特に `weekly.ts buildWeek` と `functions/_lib/datetime.ts`）。
2. **明確に安全な整理**（死CSSの本番流出停止、重複の小さな解消、コメントの陳腐化修正、ログの統一）を行う。
3. **小さな責務分離**（重複ヘルパ抽出、内部実装依存の隔離）を、各ステップでテスト/ビルド確認しながら行う。
4. **オーナー確定事項（下記 Decisions）は実装する**: 認可の fail-closed＋オーナー専用化、`/予定消去` の軽量ガード、dev tuner 撤去、PROFILE のコンフィグ化、`sharp` の明示宣言。
5. それ以外の大きい変更（index.astro のコンポーネント分割など未確定のもの）は**実装せず提案に留める**。BOOTH休眠コードは現状維持（触らない）。

非エンジニアのオーナーが運用する前提。仕様の源泉は `docs/構成図.md`、運用憲法は `CLAUDE.md`。これらと矛盾するコードを書かない。

---

## Decisions（オーナー確定事項・この指示書で実施/不実施を確定済み）

> 下の Stop And Ask は原則だが、以下はオーナーが既に判断済み。**ここに書かれた範囲は確定**として進めてよい。範囲を超える変更は引き続き Stop And Ask に従う。

- **DEC-1 認可は fail-closed ＋オーナー専用にする（実施する）**: `DISCORD_ALLOWED_USER_IDS` が空のとき現状の「全員許可」を **「全員拒否」** に変更し、**オーナーのDiscordユーザーID 1つだけ**を許可する運用にする。IDはコードに書かず環境変数のみ（`CLAUDE.md §3`）。→ D-20 前半は**実装する**。
- **DEC-2 `/予定消去` に軽いガードを入れる（実施する）**: ①**日付（`date`）を必須**にして「全件削除」を不可能にする ②**削除した件数を Discord 返信で報告**（0件なら「該当なし」と返す）。1日◯件等の重い上限は不要（オーナー専用のため）。→ D-20 後半は**この軽量版で実装する**。
- **DEC-3 dev tuner は撤去する（実施する）**: tuner の UI/スクリプト/`.tuner*` CSS を削除する。ただし**実レイアウトが依存している `--pf-*` / `--wb-*` の既定値は現在値のまま残す**（撤去で見た目が変わらないこと）。→ D-06 は「DEV限定化」ではなく**撤去**に格上げ。
- **DEC-4 PROFILE をコンフィグ化する（実施する／値は据え置き）**: `index.astro` 直書きのプロフィール/キャッチコピーを `src/config/profile.ts` 等へ移す。**文言は現状を verbatim**で移送し、出力HTMLは不変。値の本決めはオーナー入力待ち（今回は構造化のみ）。→ D-21 は**実装する**。
- **DEC-5 `sharp` を `package.json` に明示宣言する（実施する）**: 既に astro 経由で入っている `sharp` を、ポスター生成用の依存として正式に明記。新規パッケージの追加ではなく既存の明文化。Cloudflare本番ビルドには影響しない。→ D-22 の sharp 宣言は**実装する**。
- **DEC-6 BOOTHグッズ休眠コードは現状維持（触らない）**: `booth.ts`/`loadGoods.ts`/`GoodsList.astro`/`fetchTextAsBrowser`/`tests/booth.*`/`site.ts:24` は**削除も退避もしない**。→ D-19 は**実施しない**（このまま残す）。
- **DEC-7 AEOスキーマ（FAQPage/Event/VideoObject）は据え置き**: 今回のリファクタ対象外（Phase 3 のまま）。→ D-22 の AEO 部分は**実施しない**。
- **DEC-8 繰り返し予定の懸念は解消**: Discord の `/予定` で入る予定は**単発のみ**（繰り返しルールを作らない）。よって `/予定消去` が「繰り返しの1回だけキャンセルになる」問題は**運用上発生しない**。仕様確認のための停止は不要。

---

## Project Understanding（プロジェクト理解）

- **何をするか**: 個人勢VTuber「和香松庵」の公式HP。Astro（`output: 'static'`、`astro.config.mjs:7`）→ Cloudflare Pages。「カレンダーが予定の唯一の源泉」で自己更新する半自動サイト（`docs/構成図.md:7-31`）。
- **主要ワークフロー**:
  - 予定: Googleカレンダー `.ics` → `src/lib/loadSchedule.ts:24` → `buildWeek`（週間ボード, `src/lib/weekly.ts:35`）/ `ScheduleList`（/schedule）。
  - Discord→カレンダー: `functions/discord/interactions.ts` の `/予定`・`/予定消去`・`/予定表`。Cloudflare Pages Function。署名検証→認可→deferred応答→裏でGoogle Calendar API（`functions/_lib/google.ts`）。
  - 動画/ライブ: YouTube Data API → `src/lib/loadVideos.ts:67`（クォータ節約・副次失敗は継続）。
  - ポスター: `scripts/make-poster.mjs`（ics→週データ→`scripts/poster/template.html`差し込み→Chrome headless撮影→sharp→Discord Webhook）。`.github/workflows/poster.yml`（日曜18:00 JST cron / 手動 / `/予定表`からの `repository_dispatch`）。
  - 定期ビルド: `.github/workflows/build.yml`（push＋15分毎schedule、`npm test`→`npm run build`→wrangler deploy。`functions/` も同梱デプロイ）。
- **エントリーポイント**: `src/pages/*.astro`（ルート）。データ取得入口 `src/lib/load*.ts`、純パース `src/lib/{ics,youtube,schedule,weekly}.ts`、共通レイアウト `src/layouts/Base.astro`。Cloudflare関数 `functions/`。
- **主要モジュールと責務**:
  - `src/lib/ics.ts`: `.ics`→`StreamEvent[]` 純パース（RRULE/EXDATE/RECURRENCE-ID展開）。
  - `src/lib/weekly.ts`: `StreamEvent[]`→今週/来週の `WeekData` 純関数。
  - `src/lib/schedule.ts`: 表示整形（`upcomingEvents`/`groupByJstDay`/JST整形）純関数。
  - `src/lib/fetcher.ts`: fetch層分離（タイムアウト・key伏字）。
  - `src/lib/loadSchedule.ts` / `loadVideos.ts` / `loadGoods.ts`: ビルド時データ取得入口（中核失敗＝ビルド失敗）。
  - `src/lib/youtube.ts` / `booth.ts`: API/RSS純パース。
  - `functions/_lib/{discord,google,datetime}.ts`: 署名検証 / Google Calendar書込 / JST変換（WebCrypto・fetchのみ）。
  - `src/pages/index.astro`（1080行）: LP本体。データ取得3系統＋12セクション＋632行のstyle＋dev限定tuner。
- **データの流れ**: 外部（カレンダー/YouTube/BOOTH）→ `load*` → 純パース → ページ/コンポーネント。Discord→`functions`→Google Calendar→（次のビルドで）HP反映。
- **外部依存**: `node-ical@^0.26.1` のみ（`package.json:12-15`）。他は astro / vitest / typescript。`sharp` は astro 経由の暗黙依存（後述・負債）。
- **現在の検証コマンド**: `npm test`（vitest, 33件）/ `npm run build`（要 `ICS_URL`・`YOUTUBE_API_KEY`）/ `npm run dev`。

---

## Behaviors To Preserve（絶対に壊してはいけない既存挙動）

各項目は根拠付き。変更後もこれらが成立することを確認すること。

1. **中核データ取得失敗＝ビルド失敗**（`loadSchedule.ts:16,24` / `loadVideos.ts` uploads部 / `loadGoods.ts:53`）。中途半端な成功にしない（`CLAUDE.md §4`）。
2. **トップの動画だけは握りつぶして継続**（`index.astro:51-57` try/catch）。schedule失敗＝ビルド失敗との**非対称を保つ**。
3. **JST固定の日時計算**: UTC正午基準の週計算（`weekly.ts:36-42`）、JST深夜開始のUTC日付ずれ対策（`ics.ts:52-58`、`ics.test.ts:49-64`）、「21:00 JST = 12:00 UTC」（`ics.test.ts:15`）。
4. **終日予定＝休業扱い**（`weekly.ts:58`）と `dateOnly` 判定（`ics.ts:36`）。
5. **EXDATE除外・RECURRENCE-IDオーバーライド**（`ics.ts:41-59,74-87`、`ics.test.ts:33-64`）。
6. **予定IDの一意性**（`ics.ts:30`、冪等性の前提）。
7. **外部入力（動画/予定タイトル・概要）は lib層では素通し**し、表示時に Astro 既定エスケープに委譲（`ics.ts:8`, `youtube.ts:4`, `booth.ts:3`）。**lib層で追加エスケープしない（二重エスケープ防止）**。例外: ポスターHTML経路は別途要エスケープ（後述 D-08）。
8. **Discord署名検証**: raw body＋timestamp で Ed25519、**`JSON.parse` の前**に検証、失敗401（`interactions.ts:60-65`、`discord.ts:20-37`）。順序を変えない。
9. **3秒以内応答＋deferred**: 書込/生成は `ctx.waitUntil` で裏に回し即 `DEFERRED_...` 返却（`interactions.ts:97-98,104-105,112-113`）。同期で重い処理を挟まない。
10. **PING→PONG**（`interactions.ts:70-72`）。Discordのエンドポイント検証に必須。
11. **カレンダー書き込みは insert のみ・追記方向**（`google.ts:83-105`）。**双方向同期・更新を足さない**（`CLAUDE.md §4/§9`）。
12. **deleteEvent の 404/410 を成功扱い**（`google.ts:137`、冪等性）。
13. **ポスター/ビルドの cron 時刻と concurrency**（`poster.yml:9-10` 日曜09:00 UTC / `build.yml:9-10,14-16`）。
14. **FEATURED_MARK の一致**: `weekly.ts:16` と `interactions.ts:35` の `'#おすすめ'`（おすすめ強調の契約）。
15. **JS無効/クローラーで内容が見える**: reveal初期非表示は `html.js` 限定（`index.astro:65,1006-1011`）。**このゲートを外さない**。
16. **scroll-reveal gating ＋ prefers-reduced-motion**（`index.astro:1012-1014,1064-1079`）。
17. **フルブリード**: hero/`.lp-section` の `100vw` トリックと `html,body{overflow-x:clip}`（`index.astro:447,896-901`, `Base.astro:157,169,175`）。`main` の左右padding打ち消しと連動。
18. **OGP/JSON-LD は全ページ**（`Base.astro:63-79`）。`set:html` はJSON-LDの自前stringifyのみ（外部入力なし）。
19. **配信中はカウントダウン非表示**（`index.astro:97`）。
20. **API key 伏字**（`fetcher.ts:45-47`）。
21. **YouTube副次データ（再生リスト個別/ライブ判定）失敗は握りつぶして継続**（`loadVideos.ts:107-123`）。

---

## Non-Negotiables（守る前提・CLAUDE.md / 構成図）

- 仕様の源泉は `docs/構成図.md`。**構成図に無い機能を勝手に足さない**（`CLAUDE.md §0`）。
- 技術スタック固定: Astro静的 / Cloudflare Pages / node-ical。**ビルド/CIに新依存を足さない**（`CLAUDE.md §2`）。依存追加は承認制。
- 秘密情報（鍵/トークン/Webhook URL）は**環境変数のみ**、コード/リポジトリに書かない（`CLAUDE.md §3`）。`.gitignore` の `.env*` / `_discord_secret.txt` / `_poster_webhook.txt` を維持。
- 外部入力は信頼しないデータ。HTML出力時はエスケープ（`CLAUDE.md §3`）。
- 書き込み系API（カレンダー）に**呼び出し上限ガード**を実装する原則（`CLAUDE.md §3`）。
- カレンダーが唯一の源泉、書き戻しは一方向・追記のみ、冪等性、外部失敗時はビルド失敗で前回を残す（`CLAUDE.md §4`）。
- モバイルファースト、`user-scalable=no` にしない、全ページOGP/構造化データ、AEO（`CLAUDE.md §6`）。
- フェーズ単位で進め、大きな設計変更は承認を得てから（`CLAUDE.md §1`）。

---

## Stop And Ask Conditions（実装を止めて確認すべき条件）

以下に該当したら**実装を止めて質問**し、勝手に決めない:

1. ~~**認可挙動の変更**~~ → **DEC-1 で確定済み**（空＝全員拒否＋オーナーID 1つのみ許可を実装する）。これ以上の認可仕様変更（ロール判定・複数権限階層など）を足す場合のみ止める。
2. ~~**書き込みガードの追加/強化**~~ → **DEC-2 で確定済み**（`/予定消去` は日付必須＋削除件数報告の軽量版を実装する）。これを超える上限/承認フロー等を足す場合のみ止める。
3. ~~**休眠コードの削除**~~ → **DEC-6 で確定済み（現状維持・触らない）**。BOOTHグッズ一式（`booth.ts` / `loadGoods.ts` / `components/GoodsList.astro` / `fetcher.ts:21-34 fetchTextAsBrowser` / `tests/booth.test.ts` / `tests/fixtures/sample-booth.rss` / `site.ts:24 boothFeedUrl`）は**削除・退避しない**。
4. ~~**依存追加（sharp）**~~ → `sharp` の明示宣言は **DEC-5 で確定済み（実施する）**。`engines.node` 明記も可。ただし **`tsx` その他の新規パッケージ追加**は引き続き §2 と衝突 → 確認。
5. **公開挙動・互換性に影響**: `functions/` の入出力契約、Discordコマンドの仕様（DEC-1/2 の範囲を除く）、`google.ts` のAPI呼び出し方、`llms.txt`/`sitemap.xml`/OGP/JSON-LD の出力。
6. **複数設計案がある / プロダクト判断**: index.astro のコンポーネント分割粒度（PROFILE の所有先は DEC-4 で config 化に確定、AEO 着手時期は DEC-7 で据え置き確定）。
7. ~~繰り返し予定の `/予定消去`~~ → **DEC-8 で解消**（Discord入力は単発のみ＝繰り返しは発生しない）。`/予定消去` は単発削除前提でよい。その他「コードから正しさが判断できない / テストと実装が矛盾」する箇所に当たったら止める。
8. **FEATURED_MARK 一元化**: `functions/`（Cloudflare Workers）から `src/lib` を import 可能かはビルド/型構成依存（tsconfig include は `src/**` のみ）。**import経路が通らない場合は一元化せず現状の手動同期を維持**し、止めて報告。

---

## Baseline Commands（着手前に必ず実行・記録）

```bash
git status                 # 既存の未コミット変更を把握（混ぜない）
git log --oneline -5
npm ci                     # もしくは npm install
npm test                   # 期待: 33 passed（数値を記録）
npm run build              # 要 ICS_URL・YOUTUBE_API_KEY。無い場合 /videos で失敗する既知挙動
npm run dev                # 目視確認用（トップLP・各ページ）
```

注意:
- ローカルに `YOUTUBE_API_KEY` が無いと `npm run build` は **/videos のみ**失敗する（既知・あなたのせいではない）。失敗が「`YOUTUBE_API_KEY が設定されていません`」だけであることを確認し記録する。それ以外のビルドエラーが出たら止める。
- `functions/` と `scripts/` は `astro build` の型チェック対象外。ここを触ったら手動/スモークで確認する。
- **作業前のテスト/ビルド結果を必ず記録**し、各フェーズ後と比較する。

---

## Debt Map（技術的負債の地図）

各項目: 根拠 / なぜ負債 / 影響 / リスク / 改善案 / 検証 / 可否（今すぐ or 提案）。
**「提案」のものは実装せず、提案文と差分案だけ出す。**

### 安全網（テスト不足）

- **D-01 `weekly.ts buildWeek` 未テスト** — 根拠: `tests/` に `weekly.test.ts` 無し（純関数だが週境界・日曜跨ぎ・`weekOffset`・終日休業・featured判定・月名/range整形と分岐多数, `weekly.ts:35-66`）。影響: 週間ボード/ポスターの正確性。リスク: 低。改善: 固定 `now` でテスト追加。検証: `npm test`。**可否: 今すぐ実装可（最優先）**。
- **D-02 `functions/_lib/datetime.ts` 未テスト** — 根拠: `tests/` から `functions/` を読むテスト無し。純関数（`parseDate`/`parseTime`/`buildWhen`/`dayRange`、深夜跨ぎ・月跨ぎ・終日）。影響: `/予定`・`/予定消去` の日時。リスク: 低。改善: 単体テスト追加（vitest で `functions/_lib/datetime.ts` を import）。検証: `npm test`。**可否: 今すぐ実装可**。
- **D-03 ポスター差し込みのテスト無し** — 根拠: `make-poster.mjs:58-61` の正規表現置換に回帰テスト無し。影響: タイトルに `}`・`]`・`<` を含むと無言で差し込み失敗/破損。リスク: 低（テスト追加）。改善: 置換関数を純関数として切り出しテスト（特殊文字入りタイトル）。検証: `npm test`。**可否: 今すぐ実装可**（D-08/D-09の前提となる安全網）。
- **D-04 署名検証/JWTの単体テスト無し** — 根拠: `functions/_lib/{discord,google}.ts` 未テスト。リスク: 低〜中。改善: `discord.ts` の応答ビルダ＋既知ベクタでの検証、`google.ts` の `pemToDer`/`b64url` などの純部分。検証: `npm test`。**可否: 純部分は今すぐ可 / Ed25519実署名ベクタが用意できなければ提案**。

### 明確に安全な整理（挙動不変）

- **D-05 WeeklyBoard のコメント陳腐化** — 根拠: `WeeklyBoard.astro:3`「いまはサンプルデータ。後で…流し込めば自動化できる」だが実際は `index.astro:171-185` で `buildWeek` 実データ接続済み。改善: コメントを「dev用フォールバック既定値」に修正。リスク: 低。**可否: 今すぐ実装可**。
- **D-06 dev tuner を撤去（DEC-3 確定）** — 根拠: tuner script（`index.astro:346-403`）＋`.tuner*` CSS（`index.astro:426-435`）。改善: tuner の UI/スクリプト/`.tuner*` CSS を**削除**する。**重要: 実レイアウトが依存している `--pf-*` / `--wb-*` 変数（`index.astro:410-423`、`WeeklyBoard.astro:80` 等）は現在値のまま残す**（tuner は単にこれらを対話的に上書きしていただけ。撤去後も既定値で見た目が一致すること）。リスク: 低〜中（変数を消すと崩れるので消さない）。検証: `npm run build` 後 `dist/` に `.tuner`/tuner script が出ないこと＋`npm run dev` でトップ/週間ボード/プロフィールの見た目が撤去前と一致。**可否: DEC-3 により実施する**。
- **D-07 functions のエラーが運用ログに残らない** — 根拠: `interactions.ts:163,196,222` の catch は Discord 本人への `edit(⚠️...)` のみで `console.error` 無し（Workersログに痕跡なし）。改善: catch 内に `console.error` を併用（本人向け返信はそのまま）。リスク: 低。検証: 目視/ログ。**可否: 今すぐ実装可**。
- **D-08 ポスターHTMLが外部入力を未エスケープ（§3違反）** — 根拠: `scripts/poster/template.html:212-218` が `row.innerHTML` にカレンダー由来の `d.title` をエスケープせず埋め込む。影響: 実害は限定的（自分のデータ・撮影専用・投稿前）だが `CLAUDE.md §3`「HTML出力時は必ずエスケープ」違反。リスク: 低（escape関数追加のみ）。改善: テンプレ側JSに小さな `escapeHtml` を入れ `title`/`date` を通す（見た目不変）。検証: D-03のテスト＋特殊文字タイトルで撮影し欠落/実行なし。**可否: 今すぐ実装可（優先）**。
- **D-09 ポスター engines 明記 / poster.yml スモーク** — 根拠: `make-poster.mjs:19-20` が `src/lib/*.ts` を拡張子付きで直接 import → Node 24 型ストリッピング依存。`poster.yml`/`build.yml` は node 24 だが（`poster.yml:37`, `build.yml:33`）、`poster.yml:40-55` はテスト/ビルドを回さない。改善: `package.json` に `"engines": { "node": ">=24" }` を明記（安全）＋ `poster.yml` に最小スモーク（`node --input-type=module -e "await import('./src/lib/weekly.ts')"` 等）。リスク: 低。検証: CIログ。**可否: engines明記とスモークは今すぐ可。`tsx` 等の依存追加は Stop&Ask 4**。

### 小さな責務分離・DRY（低〜中リスク・テスト後）

- **D-10 followup/edit クロージャ3重定義** — 根拠: `interactions.ts:130-132,173-175,202-204` で同一の webhook URL組立＋`edit` を3箇所定義。改善: `makeEditor(env, interactionToken)` ヘルパ抽出。リスク: 低。検証: 既存3コマンドの返信が同じであること（手動）。**可否: 今すぐ実装可**。
- **D-11 INFORMATION の外部リンク属性ロジック重複** — 根拠: `index.astro:248-268` と `news.astro:14-28` が `item.url.startsWith('http') ? {rel,target} : {}` を別々に持つ。改善: 小ヘルパ（例 `src/lib/links.ts` の `externalAttrs(url)`）に抽出、両所で使用。DOM/CSSは別物なので完全共通化はしない。リスク: 低。検証: 両ページのリンク属性が不変。**可否: 今すぐ実装可**。
- **D-12 node-ical 内部依存の隔離＋終日fixture** — 根拠: `(start as unknown as {dateOnly?:boolean}).dateOnly`（`ics.ts:36`）が node-ical 内部仕様依存。`tests/fixtures/sample.ics` に終日（VALUE=DATE）ケースが無く実質未検証。改善: `dateOnly` 参照を小ヘルパに隔離＋終日予定の fixture/テスト追加（挙動は不変、判定経路を固定）。リスク: 中（回帰テストで担保）。検証: `npm test`。**可否: ヘルパ隔離＋テスト追加は今すぐ可。判定挙動の変更はしない**。
- **D-13 JST formatter / `jstKey` の重複** — 根拠: `Intl.DateTimeFormat` と `jstKey`/`jstDateKey` が `weekly.ts:8-18` と `schedule.ts:17-22` に二重。改善: `schedule.ts` に集約し `weekly.ts` が import。**前提: D-01 のテストを先に入れる**。リスク: 中。検証: `npm test`（ics/schedule/weekly）。**可否: D-01後に今すぐ可**。
- **D-14 fetcher のok判定重複** — 根拠: `fetcher.ts:8-14` と `fetcher.ts:21-34` で ok判定＋throw がコピペ。ただし `fetchTextAsBrowser` は休眠（Stop&Ask 3）。改善: 内部ヘルパ抽出。リスク: 低。**可否: グッズ方針確定まで保留（提案）**。

### 境界・契約（中リスク・要検証）

- **D-15 Discordペイロードの型/検証欠如** — 根拠: `interactions.ts:67` `JSON.parse(raw)` 無型、`body.data?.name` 等を未検証参照。改善: 最小の interaction 型定義＋`body.data` 必須チェック（依存追加なし）。`String(...)` による既存の最低限防御は維持。リスク: 低。検証: PING/各コマンドの手動疎通。**可否: 型定義追加は今すぐ可**。
- **D-16 FEATURED_MARK 一元化** — 根拠: `weekly.ts:16` ⇔ `interactions.ts:35`。改善: 共有定数に一元化。**ただし Stop&Ask 8（Workers→src の import 可否）を先に検証**。通らなければ現状維持＋「両方同時に変える」コメント強化のみ。リスク: 中。検証: `npm test`＋ functions のローカル/CIビルド。**可否: import検証が通った場合のみ実装、通らなければ提案**。
- **D-17 ポスター差し込みを正規表現→プレースホルダ方式へ** — 根拠: `make-poster.mjs:58-61` の `[^}]*` / `[\s\S]*?` は `}`/`]` 入りで壊れる。改善: テンプレに明示プレースホルダ（例 `<!--SCHEDULE_JSON-->`）or `<script type="application/json">`＋`textContent` 方式（innerHTML排除でD-08も同時解消）。リスク: 中（テンプレ内部変更）。検証: D-03テスト＋実撮影。**可否: 提案（D-03/D-08 を先に。方式変更はテンプレ契約に触れるため小さく）**。

### 提案のみ（実装しない）

- **D-18 index.astro のコンポーネント分割** — 根拠: 1080行（データ取得3系統＋12セクション＋632行style＋tuner, `index.astro:1-1080`）。改善案: `PickupList.astro`/`GoodsBanner.astro`/`SnsBanners.astro`/`SectionHead.astro` を**1つずつ**抽出し、各抽出後に `npm run build`＋目視。共通CSS（`.section-head`/`.lp-section`/`.btn`）の移設はフルブリード/スコープ崩れに注意。リスク: 中（視覚回帰テスト無し）。**可否: 提案（Stop&Ask 6。承認後に1コンポーネントずつ・出力不変を厳守）**。
- **D-19 BOOTHグッズ休眠コード** — `booth.ts`/`loadGoods.ts`/`GoodsList.astro`/`fetchTextAsBrowser`/`tests/booth.*`/`site.ts:24`。**可否: DEC-6 により現状維持（触らない・削除も退避もしない）**。
- **D-22b cache実装3種の統一 / window二重フィルタの整理** — `CLAUDE.md §2`/プロダクト判断に関わる。**可否: 提案（Stop&Ask 5,6）**。
- **D-22c AEOスキーマ（FAQ/Event/VideoObject）** — **可否: DEC-7 により据え置き（今回やらない）**。

### 確定済み・実装する（Decisions 由来）

> 下記は Stop&Ask 1〜4/7 にかかるが**オーナー判断済み**。指示書 Decisions の範囲で実装する。Phase 割り当ては Implementation Phases 参照。

- **D-20a 認可 fail-closed＋オーナー専用（DEC-1）** — 根拠: `interactions.ts:81` の空allowlistフォールスルー。改善: 空のとき**全員拒否**にし、`DISCORD_ALLOWED_USER_IDS` のIDのみ許可。IDは環境変数のみ（コードに書かない）。リスク: 中（誤ると自分も弾く）。検証: 自分のIDで通り・別IDで拒否されることを手動疎通。**可否: 実装する**。
- **D-20b /予定消去 の軽量ガード（DEC-2）** — 根拠: `interactions.ts:108-114,168-198`。改善: ①`date` 必須（無指定や全件削除を拒否）②`deleteEvent` 実行後の**削除件数を返信**（0件は「該当なし」）。重い上限/KV依存ガードは入れない。リスク: 低。検証: 日付指定で該当のみ消える・件数が返る・日付無しは弾く（手動）。**可否: 実装する**。
- **D-21 PROFILEコンテンツの構造化（DEC-4）** — 根拠: `index.astro:132-155` の仮値/キャッチコピー。改善: `src/config/profile.ts` 等へ**文言 verbatim**で移送し、`index.astro` はそれを参照（出力HTML不変）。リスク: 低。検証: `npm run build`＋目視で文言・並び不変。**可否: 実装する（値の本決めはオーナー入力待ち＝構造化のみ）**。
- **D-22a sharp の依存明示宣言（DEC-5）** — 根拠: `package.json:12-15` に sharp 無し（astro 経由の暗黙依存）。改善: `dependencies` または `devDependencies` に現行バージョンで明記（新規追加ではなく既存の明文化）。`engines.node>=24` 明記も同時に可。リスク: 低。検証: `npm ci`＋`npm test`＋ローカルでポスター生成が従来通り。**可否: 実装する**。

---

## Implementation Phases（実装フェーズ・小さく安全な順）

> 各フェーズは独立した小コミットにする。フェーズ完了ごとに検証し、結果を記録。**未確定（Stop&Ask）に当たったら止めて報告**。

- **Phase 0 — 現状把握**: `git status` で既存の未コミット変更を確認し**混ぜない**。Baseline Commands を実行し、テスト数/ビルド結果を記録。
- **Phase 1 — 安全網（先にテスト）**: D-01（weekly.buildWeek）, D-02（datetime）, D-03（ポスター差し込みの純関数化＋特殊文字テスト）。可能なら D-04 の純部分。**この後でなければ D-13/D-17 等に進まない**。
- **Phase 2 — 明確に安全な整理（挙動不変）**: D-05（コメント修正）, D-06（.tuner CSSのDEV限定化のみ）, D-07（functions の console.error）, D-08（ポスターtitle/dateのescape）, D-09（engines明記＋poster.yml スモーク）。
- **Phase 3 — 小さな責務分離/DRY**: D-10（makeEditor）, D-11（externalAttrsヘルパ）, D-12（dateOnly隔離＋終日fixture）, D-13（JST formatter集約, D-01後）。
- **Phase 4 — 境界/契約（要検証）**: D-15（Discord型/検証）, D-16（FEATURED_MARK, Stop&Ask 8 検証必須）, D-17（ポスター差し込み方式, 小さく・テスト後）。
- **Phase 5 — オーナー確定事項の実装（Decisions）**: D-22a（sharp 明示＋engines）→ D-21（PROFILEコンフィグ化, 文言verbatim・出力不変）→ D-20a（認可 fail-closed＋オーナー専用）→ D-20b（`/予定消去` 日付必須＋件数報告）。**認可とDiscord系（D-20a/b）は `functions/` 変更のため、可能な範囲で手動疎通を行い、各々を別コミットにする**。実装後、オーナーに「自分のDiscordユーザーIDを環境変数 `DISCORD_ALLOWED_USER_IDS` に入れる」手順（開発者モードでID取得→ローカルファイル/環境変数経由、チャットに貼らない）を案内する。
- **Phase 6 — テストしやすさ**: loader層の fetcher 注入テスト（`loadScheduleWith`/`loadVideosWith` をモックfetcherで）, poster経路スモークの拡充。
- **Phase 7 — 提案のみ（実装しない）**: D-18, D-22b。提案文＋差分案＋リスク＋検証手順を出して停止。承認を得るまで実装しない。（D-19/D-22c は Decisions により対象外、D-19=現状維持・D-22c=据え置き。）

---

## Verification Requirements（検証要件）

- 各フェーズ後に `npm test`（**33件以上が pass、減らさない**。追加分は増えてよい）。
- `src/` を触ったら `npm run build`。`YOUTUBE_API_KEY` が無い環境では「/videos のみ既知失敗」以外のエラーが無いことを確認（あれば止める）。
- 表示に関わる変更（Phase 2の D-06、Phase 6の D-18 等）は `npm run dev` で**トップLP＋該当ページを目視**。フルブリード（横スクロール無し）、reveal、配信中カウントダウン非表示、各セクションの並びが不変であること。
- `functions/` を触ったら: 型チェック対象外なので、最低限ローカルで `node --check` 相当の確認＋（可能なら）Discord PING/コマンドの疎通。署名検証・deferred・PONG の順序を壊していないこと。
- `scripts/make-poster.mjs`/`template.html` を触ったら: D-03テスト＋ローカルで実撮影（`CHROME_BIN` 指定）し、1920×1080・文字欠落/破損が無いこと。
- 変更は**小さく戻しやすい単位**。1コミット=1論点。無関係な整形・ついでのリファクタを混ぜない。

---

## Reporting Format（報告フォーマット）

各フェーズ完了時に、次を簡潔に報告:

1. **対象負債ID**（例 D-01, D-05）と変更ファイル一覧。
2. **実行コマンドと結果**（`npm test` の pass数、`npm run build` の成否＋既知失敗の有無）。
3. **挙動が不変であることの根拠**（どの Behaviors To Preserve を確認したか）。
4. **逸脱・想定外**（あれば）。
5. **Stop&Ask に当たった点**（あれば、該当条件番号と理由、質問内容）。
6. 最後に**実行した全コマンドと結果のサマリ**。

提案のみ（Phase 6）は、実装せず「提案・差分案・リスク・検証手順・推奨順位」を出して停止。

---

## Out-of-scope Items（今回やらないこと）

- 見た目の刷新・新セクション・新機能の追加（構成図に無いもの, `CLAUDE.md §0`）。
- コンテンツの本決め（PROFILE仮値・キャッチコピー・ガイドライン方針・おすすめ動画選定・INFORMATION記事・専用バナー画像）。これらはオーナーの入力待ちで、リファクタの対象外。
- DEC-1/2 の範囲を超える認可・書込仕様の追加（ロール権限階層、重い上限/承認フロー等）を承認なしに実装すること。※ fail-closed＋オーナー専用（D-20a）と `/予定消去` 軽量ガード（D-20b）は DEC-1/2 で確定済み＝実施対象。
- 休眠コード（BOOTHグッズ一式 D-19）の削除/退避（**DEC-6 により現状維持＝触らない**）。
- `sharp` 以外の新規依存（`tsx` 等）を承認なしに足すこと（`sharp` 明示宣言と `engines.node` 明記は DEC-5 で実施対象）。
- AEOスキーマ（FAQPage/Event/VideoObject）等 Phase 3 範囲の本格実装（**DEC-7 により据え置き**, `Base.astro:62` に明記）。
- `scripts/poster/template.html` の巨大 base64 立ち絵データの編集。
- index.astro の大規模分割（D-18）の**承認なしの**実施。

---

### 付記: プロセス制約（毎フェーズ厳守）

- 最初に `git status` を確認し、既存の未コミット変更（例 `docs/progress.md` 等）と自分の変更を混ぜない。
- 編集前に baseline の検証結果（テスト数・ビルド成否）を記録する。
- 変更は小さく戻しやすい単位。無関係な整形やついでのリファクタをしない。
- 既存挙動を勝手に変えない。正しさが不明な場合は実装を止めて質問する（Stop And Ask）。
- 各フェーズごとに検証し、最後に実行したコマンドと結果を報告する。
- 古いコードを一律「悪」と決めつけない。証拠なく大きな削除・全面書き換えをしない。
