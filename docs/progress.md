# 進捗メモ（フェーズ間の引き継ぎ用）

## Phase 1（完了・本番公開 2026-06-13）
- **公開URL: https://vtuber-hp.pages.dev/** で稼働中
- 自動更新: GitHub Actions が15分ごと＋push時にビルド→Cloudflare Pagesへデプロイ
- 中身: Astro雛形・IA通り8ページ骨格・.icsスケジュール連動表示（テスト16件）・立ち絵主役トップ＋次の配信カウントダウン・テイスト「シンプル上品」（オフホワイト＋くすみ金＋見出し明朝）・Discord故障通知（連続失敗で@everyone）・手順書01〜04・最終レビュー済み
- 表示名「和香松庵」（src/config/site.ts の name）。立ち絵は仮シルエット（public/hero-silhouette.svg）。本物ができたら public に画像を置き heroImage パスを差し替え
- リポジトリ: github.com/WakamatsuIori/-HP（Public）。Cloudflare Pagesプロジェクト名: vtuber-hp
- 注意点:
  - GitHub仕様: リポジトリに60日間コミットが無いと schedule 実行が自動停止（止まると故障通知も鳴らない）。対策（定期空コミット等）は未実装・要検討
  - 独自ドメインは未取得（pages.dev の無料URLで運用中）。取得したら astro.config.mjs の site と Pages のカスタムドメイン設定を更新
  - 秘密情報は全てGitHub Secrets（ICS_URL / DISCORD_WEBHOOK_URL / CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID）。ローカルは .env（gitignore済み）

## デザイン作り込み（完了 2026-06-13・見た目専用、機能は不変）
- 見出し・ロゴを **Zen Old Mincho のサブセット woff2**（約50KB・public/fonts/）でセルフホスト。@font-face＋preload、--font-serif 先頭に追加。本文はシステムフォント維持。再生成は `python scripts/subset_fonts.py`（見出しに新しい漢字を足したら HEADINGS に追記して再実行）。OFL.txt 同梱。
- **OGP画像** public/og.jpg（1200×630・横長KV IMG_5834＝黒地。`node scripts/make-og.mjs` で生成、背景色は支配色から決定）＋ Base.astro head に og:/twitter:/canonical meta。※JSON-LD 等の本格SEOは Phase 3。
- トップ立ち絵：背後に静止グロー、レスポンシブ画像(widths/sizes)でモバイル軽量、ローマ字ロゴ追加。
- 配色：本文リンク用に `--accent-strong`（濃い金）で AA コントラスト確保。h2 に金アクセント、ナビ現在地に金下線。
- 生成ツール(fonttools/sharp)はローカルのみ＝**npm run build / CI に新依存なし**。成果物(woff2/og.jpg)はリポジトリ同梱。
- コミット: 4cb063b(font) / b6b29c4(ogp) / 331b5ff(hero) / 684a7dd(type) / e5c13d5(ogp背景修正)。**push 未実施**（公開は承認後）。

## Phase 2以降で実装予定（ユーザー承認済み 2026-06-13・構成図外の追加機能）
- Discordから予定登録: `/予定 6/15 21:00 タイトル` 等のテンプレ書式/スラッシュコマンドでGoogleカレンダーに書き込む。ユーザーが「必要」と判断し実装決定。Phase 2で用意するカレンダー書き込み（サービスアカウント）に相乗りして作る。Phase 2のプランモードで正式にスコープへ入れること。代替（暫定）: Googleカレンダー公式アプリの音声入力。

## 次フェーズ（Phase 2: 自動更新コア）の入口メモ
- 構成図§5 Phase 2: YouTube API（最新動画＋再生リスト自動分類）/ ライブ判定の窓方式＋確定枠埋め込み＋カレンダー書き戻し / BOOTHフィード→グッズ / フォールバック・冪等性
- 事前にユーザー準備が要るもの: YouTube Data API v3 キー、対象YouTubeチャンネルID、（書き戻し用）Googleサービスアカウント＋対象カレンダーへの書き込み共有、BOOTHショップのフィードURL
- 開始時は必ずプランモードで計画提示→承認後に実装（CLAUDE.md §1）
