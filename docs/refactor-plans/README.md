# リファクタリング計画書（セッション別・全6冊）— 全体ガイド

> 作成日: 2026-07-02 ／ 基準コミット: `cc408d1`（main）
> 本計画は**計画のみ**であり、コードは1文字も変更していない。実行は別のAI（以下「実行者」）が担当する。

## これは何か

このリポジトリ（VTuber「和香松庵」公式HP）は、機能ごとの開発セッションを積み重ねて作られてきた。
本フォルダは、その**現存する6つの作業系統（＝セッション）ごとに独立したリファクタリング計画書**を収める。

| フォルダ | 対象セッション | 主な対象ファイル |
|---|---|---|
| `session-01-data-core/` | データ取得・純ロジック層＋ビルド基盤CI | `src/lib/*`, `src/config/*`, `src/pages/{sitemap.xml,llms.txt}.ts`, `.github/workflows/{build,keepalive}.yml` |
| `session-02-lp-layout/` | トップLP・共通レイアウト・サブページ（黒×金デザイン） | `src/pages/index.astro`, `src/layouts/Base.astro`, `src/components/*`（フォーム・ライブ以外） |
| `session-03-discord-calendar/` | Discord→カレンダー連携（/予定・/予定消去・/予定表・/更新） | `functions/discord/*`, `functions/_lib/{discord,google,datetime}.ts`, `scripts/register-discord-commands.mjs` |
| `session-04-contact-form/` | 問い合わせフォーム（Discord通知＋Sheets記録＋Turnstile） | `functions/contact/*`, `functions/_lib/contact.ts`, `src/components/ContactForm.astro` |
| `session-05-poster/` | 週間ポスター自動生成・Discord投稿 | `scripts/make-poster.mjs`, `scripts/poster/*`, `.github/workflows/poster.yml` |
| `session-06-live-badge/` | ライブ配信バッジ（訪問時チェック /api/live） | `functions/api/live.ts`, `src/lib/live.ts`, `src/components/LiveBadge.astro` |

各フォルダの `計画書.md` は**単体で完結**しており、実行者はその1冊とリポジトリのコードだけで作業できる。

## 全セッション共通のベースライン（基準コミット時点の実測値）

- 実行環境: **Node.js 24以上必須**（`package.json` の `engines`。`.ts` を Node が直接 import する箇所があるため）
- `npm ci && npm test` → **テストファイル11個 / 112件 全パス**。内訳:
  `contact 18 / datetime 27 / ics 9 / links 2 / live 8 / loadSchedule 5 / loadVideos 7 / poster-inject 5 / schedule 8 / weekly 9 / youtube 14`
- `npm run build` は環境変数 `ICS_URL` と**本物の** `YOUTUBE_API_KEY` の両方が必要。
  - キー無しの場合、`/videos` ページのレンダリングで「YOUTUBE_API_KEY が設定されていません」で**ビルド全体が失敗する（既知・仕様）**。
  - カレンダー側だけなら `node tests/demo-ics-server.mjs` を起動して `ICS_URL=http://127.0.0.1:8125/demo.ics` で代替できる。
  - フルビルドの最終確認は CI（main への push で `build.yml` が走る）に委ねてよい。
- 本番デプロイは **main への push でのみ**発生する。作業ブランチへの push は本番に影響しない。

## セッション間の依存・競合（重要）

**推奨実行順: 01 → 02 → 03 → 04 → 05 → 06（番号順・必ず1セッションずつ直列で）。並行実行は禁止。**

| 競合・依存 | 内容 |
|---|---|
| `src/lib/live.ts` | session-01の項目 S1-05（YouTube API定義の一元化）と session-06 が両方触る。番号順なら衝突しない |
| `src/pages/index.astro` | session-02 が広く触り、session-06 の S6-05（`?live=1` 削除）も触る。番号順なら衝突しない |
| `functions/_lib/google.ts` | session-03 の S3-07 がヘルパを新設し、session-04 の S4-07 がそれを利用する（**S4-07 は S3-07 完了が前提**。未完了ならスキップ） |
| 行番号のずれ | 各計画書の行番号は基準コミット `cc408d1` 時点のもの。**先行セッションの実施後は行番号がずれるため、必ず併記のコード断片で位置を特定すること** |

## 全セッション共通ルール（各計画書にも再掲済み）

1. **1項目 = 1コミット**。項目IDをコミットメッセージに含める（例: `refactor(S1-02): sitemapに/news/を追加`）。
2. 各項目の**完了条件を満たせない場合は、その場で中断してオーナーに報告**する。無理に先へ進まない。
3. `npm test` のパス数を**絶対に減らさない**（テストの削除・skip化は計画書に明記された場合のみ）。
4. 秘密情報（APIキー・Webhook URL・トークン・カレンダーの限定公開URL）をコード・コミット・ログに**絶対に書かない**（`CLAUDE.md` §3）。
5. 「〜計画書に書かれていないが直したほうが良さそうな箇所」を見つけても**触らない**。メモしてオーナーに報告するだけにする。
6. main へは直接 push しない。作業ブランチで完結させ、マージはオーナーの確認後。

## 関連資料（リポジトリ内）

- `CLAUDE.md` — プロジェクト憲法（特に §3 秘密情報・§4 冪等性/フォールバック）
- `docs/構成図.md` — 仕様の源泉
- `refactor-instructions.md` — 過去の第1次リファクタ指示書。**「Behaviors To Preserve」（絶対に壊せない挙動14項目）は現在も有効**
- `docs/progress.md` — 到達点の記録（※「テスト94件」の記述は古い。現在112件）
