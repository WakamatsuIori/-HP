# 進捗メモ（フェーズ間の引き継ぎ用）

## Phase 1（2026-06-13 実装）
- 完了: Astro雛形・8ページ骨格・.icsスケジュール表示（テスト16件）・build.yml（15分ビルド＋Discord故障通知）・手順書01〜04・コードレビュー済み（JST深夜のoverride照合バグを修正済み）
- 未完了: ユーザーの外部セットアップ（カレンダー/Discord/GitHub/Cloudflare）→ 初回デプロイ → 公開確認
- 注意点:
  - 本人情報は `src/config/site.ts` の仮値。確定後に差し替え＋`astro.config.mjs` の site URL も実URLへ
  - リポジトリはPublic前提（PrivateだとActions無料枠を超える）
  - GitHubの仕様: リポジトリに60日間コミットが無いと定期実行が自動停止する（停止すると通知も鳴らない）。対策は要検討・未実装（ユーザーへ提案済みにすること）
  - Pagesプロジェクト名 `vtuber-hp`（build.ymlのPAGES_PROJECT_NAME。subdomain衝突時は変更）
