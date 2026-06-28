# 進捗メモ（フェーズ間の引き継ぎ用）

> 最終棚卸し: 2026-06-17。本番: **https://wakamatsu-iori.com**（Cloudflare Pages / push＋15分ごと自動デプロイ）。
> 詳細な決定ログ（DEC-番号・リファクタPhase番号）は **`refactor-instructions.md`** と各コミットを参照。

## 公開・インフラ
- 独自ドメイン **wakamatsu-iori.com** に切替済み（`astro.config.mjs` の site／robots.txt／llms.txt／sitemap.xml に反映）。旧 pages.dev も有効。
- リポジトリ: github.com/WakamatsuIori/-HP（Public）。Cloudflare Pages プロジェクト名 `vtuber-hp`。
- `build.yml`: push時＋**1時間ごと cron**（毎時0分。旧15分から変更・2026-06-20）＋**Discord `/更新`(repository_dispatch=rebuild-site)で即時再ビルド** → `npm test` → `npm run build` → wrangler deploy。失敗時 Discord 通知（連続失敗で @everyone）。※クォータ余裕（YouTubeは search.list不使用で1ビルド最大15u≒1日360u）。ライブバッジのリアルタイム性はフェーズ2（訪問時チェック・120秒キャッシュ・未着手）で別途対応予定。
- `poster.yml`: 日曜18:00 JST に週間スケジュールのポスター画像を生成→Discord投稿（`scripts/make-poster.mjs` ＋ Puppeteer）。
- Secrets（GitHub）: ICS_URL / DISCORD_WEBHOOK_URL / CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / YOUTUBE_API_KEY / Discord・カレンダー書き込み系（サービスアカウント・GITHUB_DISPATCH_TOKEN 等）。ローカルは `.env`（gitignore）。
- **注意**: ローカル `.env` に `YOUTUBE_API_KEY` は未設定 → ローカルの全ビルドは /videos で失敗する（本番は GitHub Secret でOK）。ローカルで動画/トップを確認したい時は .env にキーを入れる。
- **GitHub仕様**: 60日コミットが無いと schedule 自動停止（活動中は問題ないが対策は未実装）。

## ロードマップ（構成図§5）状態

### Phase 1 土台 … ✅ 完了
ドメイン/ホスティング/SSL・Astro雛形・.icsスケジュール・15分ビルド＋Discord故障通知。

### Phase 2 自動更新コア … 🔶 ほぼ完了
- **#5 YouTube最新動画＋公開再生リストのミラー仕分け … ✅**（commit 421280f。`lib/youtube.ts`/`loadVideos.ts`/`VideoList.astro`/`videos.astro`＋トップ最新動画。search.list不使用のクォータ節約）
- **#6 ライブ判定（→訪問時チェックで実装済み） / 確定枠の埋め込み / カレンダー書き戻し … 🔶**
  - 済: ライブ中バッジ（ビルド時 `liveBroadcastContent=="live"` 検知。`LiveBadge.astro`、トップに表示）
  - **✅ ライブバッジのリアルタイム化（訪問時チェック方式・2026-06-20）**：窓方式ワーカーは不採用。訪問時にブラウザJSが受け口 `functions/api/live.ts` をfetch→サーバー側でYouTube確認→バッジ点灯/消灯/タイトル差替。判定は `src/lib/live.ts`(`loadLiveStatusWith`/`resolveLiveStatus`・既存`parseLiveStatus`再利用)。edge **s-maxage 120秒**キャッシュ＝クォータ安全(最大2,880u/日)、失敗・キー未設定時は非ライブ短TTLでページを壊さない。タイトルは`textContent`挿入でXSS回避。tests/live.test.ts 追加。構成図§3後回し→着手・§5#6に注記済み。**✅デプロイ＋本番検証済み（2026-06-20、commit da0fff3）**：Cloudflare Pages env に `YOUTUBE_API_KEY` 追加済→`/api/live`が`s-maxage=120`返却＝キー有効確認。`/更新`も本番で実動作確認済み（repository_dispatch→rebuild-site 成功）
  - **未: ①確定枠（YouTube枠↔カレンダー予定）の埋め込み表示 ②カレンダー書き戻し（説明欄へPATCH追記）**。※`functions/_lib/google.ts` は現状 insert/delete のみ（書き戻しPATCHは無い）
- **#7 BOOTHグッズ … ✅（リンクのみで方針確定・2026-06-19）** BOOTHがRSS提供終了（実ブラウザでも HTTP 406）→ 自動掲載は不可。**HPはショーケースに徹し購入はBOOTHへのリンクで誘導**（`goods.astro`、静的・fetchなし）。方針確定に伴い旧BOOTH取得コードは**削除済み**: `lib/booth.ts`・`loadGoods.ts`・`GoodsList.astro`・`fetcher.ts`の`fetchTextAsBrowser`・`site.ts`の`boothFeedUrl`・`booth.test.ts`・`fixtures/sample-booth.rss`・`docs/setup/06-booth-feed.md`（必要時はgit履歴から復活可）。※手動カード掲載は「後回し」
- **#8 フォールバック（最終更新時刻）＋冪等性 … ✅**

### Phase 3 HPの存在意義 … 🔶 一部
- **#9 お仕事依頼ページ … ⬜** `work.astro` はプレースホルダ（**フォーム未設置**・X DM誘導のみ）。←案件導線＝最優先
- **#10 ガイドライン/プロフィール/プライバシー … 🔶** ガイドラインはトップに集約（独立ページ廃止）／`privacy.astro` は仮文言／プロフィールは `config/profile.ts` に構造化済（文言は仮）／**/about の空「世界観・設定」仮置きブロックを削除**（張り紙状態の解消・2026-06-19、commit 1171d6f）。※本人の世界観文が確定したら同セクションを本文付きで再追加すること（/about はメニュー非掲載の検索/AI向けページ）
- **#11 SEO … 🔶** JSON-LD(Person+WebSite)・`llms.txt`・`sitemap.xml` は実装済（`Base.astro`／`pages/*.ts`）／GA4・Search Console 設置済／**トップ`<title>`を集客向けに強化**（`site.ts`の`homeTitle`・2026-06-19）／**404ページ追加**（`src/pages/404.astro`＝`noindex`・Cloudflareが存在しないURLにHTTP404を返す＝ソフト404解消・2026-06-19）／VideoObject・Event は据え置き

### Phase 4 半自動の頭脳 … 🔶 / ⬜
- **#12 AI告知文生成→Notion承認 … ⬜**（`prompts/`・`docs/persona.md` 未作成）
- **#13 緊急キルスイッチ … ⬜** 未実装（炎上/訃報時の安全装置＝設計上の要対応）
- **#14 デザイン作り込み … 🔶** 大半完了（明朝/OGP/ヒーロー/フッター刷新/LP各セクション）。GALLERY=Coming soon。Cinzelフォント導入済／**ファビコン拡充**：`favicon.svg`(庵マーク)に加え検索/旧来クローラー向けに`favicon-48.png`・`favicon.ico`(16/32/48内包)・`apple-touch-icon.png`(180)を`scripts/make-favicons.mjs`(sharp)で生成しBaseにlink追加（Google検索の汎用アイコン表示=サイトアイコン無し を解消狙い・反映はGoogle再クロール次第・2026-06-19）／**ブランドトーン確定：明クリーム×金（土台）＋黒×金カード（アクセント）を正式採用**（2026-06-19 本人決定。母艦CLAUDE.md§2・記憶を更新。研究系docsの旧「黒×金」表記は素材説明として残置）／**淡背景×淡い金のコントラスト改善**：`/schedule`の配信時刻`.time`(3.2→5.86)・トップ英語キャッチ`.about__catch-en`(3.04→5.57)を`--accent`→`--accent-strong`でAA確保（装飾◆や404大数字は意図的淡金で維持・2026-06-19）

### Phase 5 任意 … ⬜ 未着手（X自動投稿/ニュースレター/多配信/専用承認画面）

## 構成図外の追加機能（承認のもと実装・稼働中）
- **Discordから予定操作**: `/予定`・`/予定消去`・`/予定表`・**`/更新`（サイト即時再ビルド・2026-06-20追加）**（`functions/discord/interactions.ts`／`functions/_lib/{google,discord,datetime}.ts`。サービスアカウントで Google Calendar insert/delete。認可は fail-closed＋オーナー専用）。コマンド登録は `scripts/register-discord-commands.mjs`。※`/更新`はデプロイ＋**Discordへのコマンド登録（global）も完了済み（2026-06-20）**。登録時にBotトークンも再発行（スクショ流出分の安全化）済み。
  - **`/予定` 入力改善 Step1（2026-06-22）✅実装・デプロイ・登録(global)完了**：日付の手打ちを廃止し **月・日を数値選択＋時間/プラットフォームを選択肢化**、**年は自動**（過ぎた月日は翌年送り）、存在しない日付(2/30等)を拒否、**登録前に確認カード（[✓確定]/[✕やり直す]）** を表示。確認データは ephemeral の embed.title＋ボタン custom_id で往復＝**KV不要**。実装＝`functions/_lib/datetime.ts`(`buildWhenFromParts`/`encode・decodePendingId`)・`discord.ts`(MESSAGE_COMPONENT/ボタン)・`interactions.ts`(確認→確定の2段フロー)。仕様は `docs/discord-予定コマンド改善_仕様.md`。**✅デプロイ済（push: ee846b9）＋global登録 実行成功**（GitHub Action run 27912791441／Discordクライアントへの反映は最大1時間。即時化したい時は guild_id 指定で再実行）。タイトルに `max_length:100`（embed.title 256字上限対策・code-review指摘）。**コマンド登録をボタン化**：新規 `.github/workflows/register-commands.yml`（Actions→「Discordコマンドを登録」→Run workflow。Secrets=`DISCORD_APP_ID`/`DISCORD_BOT_TOKEN` 登録済）。二重登録は確定時のボタン即除去で実用上防止（厳密な重複排除はKV未導入で非対応＝既知の小制約）。Step2(相対えらび)・Step3(その他時刻/重複・過去警告)は未着手。
- **週間ポスター自動生成・投稿**（上記 poster.yml）
- **llms.txt 自動生成**（AEO対応）／**お知らせ一覧ページ** `news.astro`

## 並行リファクタ（完了・別系統の Phase/DEC 番号）
安全網テスト追加・重複集約・境界型付け・定数一元化・`SectionHead.astro` 抽出・profile/information/featured の config 化・sharp 直接依存化・loader層のfetcher注入テスト 等。**詳細は `refactor-instructions.md` と該当コミット**。

## いま公開前（未コミット/未push）
- main は origin より先行（未pushコミットあり）＝反映待ちが出ることがある。デザイン調整中（Cinzelフォント・favicon・Prettier設定・フォント再サブセット）。
- **トップ ブラッシュアップ（作業中・ブランチ `design/top-fullwidth-brushup`・未push・2026-06-28）**：本文720px→幅トークン化で全画面寄せ（`--content`1180/`--content-wide`1320/`--content-prose`720。`Base.astro`・`index.astro`）。演出は **静(refined)／動(dramatic)** の2版を実装し `?fx=dramatic` で切替（`Base.astro` の is:inline＋全 dramatic CSS を `html[data-fx='dramatic']` でガード）。動＝ヒーロー金の靄/金粉/一閃・見出し一字ずつ立つ・区切り金スイープ・帯背景の金漂い・予定盤の金スイープ。reduced-motion／モバイルは自動で軽量化。**本人が静/動を未決定（保留中）**。決定後＝敗者CSS・`?fx` 配線を削除→`/code-review`→push で反映。テスト94件パス。ローカル全ビルドは従来どおり `/videos` の YouTube キー未設定で停止（CI は通る）。計画書＝`C:\Users\wakam\.claude\plans\temporal-swinging-clock.md`。
- **【最新・方針転換 2026-06-29】トップを「全く新しい形」へ全面リデザイン中（黒×金 没入シネマ×グロー・同ブランチ `design/top-fullwidth-brushup`・未push）**：本人が上記の静/動（明クリーム×金の延長）を見て「テイストごと変えた全く新しい形に」と方針転換。見本帳から「C 没入シネマ×グロー」採用、トーンは **黒×金・耽美**（＝2026-06-19の明クリーム×金からのブランド転換。**採用確定時に母艦CLAUDE.md§2・記憶[[lp-design-direction]]を更新**）。**現行トップ(index.astro)・静/動には触れず、独立プレビュー `src/pages/preview-immersive.astro`（noindex・使い捨て）で全面構築**。内容：ガラス質固定ナビ／全画面没入ヒーロー(KV＋シネマ的スクリム＋ラジアル金グロー＋カーソル光)／PROFILE(立ち絵＋表)／ABOUT／SCHEDULE(ガラスカード)／VIDEO／INFORMATION(config)／STORE(BOOTH)／FOLLOW(各色グローカード blur45+グラデ枠)／GUIDELINE／**CONTACT=自作フォーム(黒×金・Googleフォーム埋め込みは廃止・送信繋ぎは後で本人確認済)**。＋**LPエディタ風 調整パネル**（スライダー:立ち絵/光プール/カーソル/縁/グロー/トーン＋ドラッグ移動・ホイール拡縮で hero/profile/about を個別配置、localStorage保存、「設定をコピー」で確定値→焼き込み）。見本帳演出4種:ロード画面(Type Motion RISE「和香松庵/Official Site」)・フロストガラス丸アイコンCTA・グローカード・floatSlow浮遊。本人調整値を既定化済(form=dark, spotlight0.3/cursor170/vignette0.25/glow0.85, 各要素配置)。テスト94パス・preview-immersiveビルドOK(/videosのみキー未設定で停止＝既知)。**実機=`http://localhost:4330/preview-immersive`（ロード画面はタブ1回のみ＝再表示は新タブ）**。⏭ **本人「もう少しプレビューで調整」＝本番未昇格(保留)**。昇格時＝preview→本番index化(専用レイアウト抽出・調整パネル/?form配線除去・現行トップと静/動を置換・ヘッダ/フッタ整理・ブランド記述更新・/code-review)。これで前回の静/動は役目終了見込み。計画書＝`~/.claude/plans/temporal-swinging-clock.md`。
- `docs/research/`：フォント/エフェクト/和あしらいの研究カタログ（選定資料）。

## 次にやるべき優先（ロードマップ順）
1. **#9 お仕事依頼フォーム**（Googleフォーム埋め込み＋ハニーポット＋実績/メディアキット）＝HP最大の価値
2. **#11 GA4 / Search Console**（効果測定が現状ゼロ）
3. **#6 カレンダー書き戻し＋確定枠埋め込み**（Discordの書き込み基盤に相乗り可）
4. **#13 緊急キルスイッチ**
5. **#10 プライバシーポリシー正式版**（GA4/フォーム導入と同時）

## 進め方
- 各フェーズ着手は CLAUDE.md §1：プランモードで計画→承認→実装→`/code-review`→停止。
