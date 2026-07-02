---
name: discord-command
description: Discordスラッシュコマンド（/予定 系・/更新 など）の追加・変更・削除を行うときに使う。コマンドの中身のロジック変更、選択肢やボタンフローの変更、新コマンドの登録が対象。HP本体のページ変更やDiscord Webhook通知（故障通知）には使わない。
---

# Discordコマンドの追加・変更手順

Cloudflare Pages Functions 上の Discord Interactions（`functions/discord/interactions.ts`）に対するコマンド追加・変更の定型フロー。

出典: `/予定` 入力改善の実績（commits 8690b5e→4174242→2e2b1a4→bade9e8→ee846b9）、`docs/progress.md`「構成図外の追加機能」節。

## 手順

1. **純ロジックをテスト先行で追加する**
   - 日付・文字列などの計算ロジックは `functions/_lib/datetime.ts`、Discordの型・Embed/ボタンビルダーは `functions/_lib/discord.ts`、Google Calendar操作は `functions/_lib/google.ts` に置く。`interactions.ts` にロジックを直書きしない。
   - 対応するテストを `tests/` に先に書く（例: `tests/datetime.test.ts`）。外部APIはfetch層を分離しモックでテストする。
2. **`functions/discord/interactions.ts` に配線する**
   - APPLICATION_COMMAND（コマンド本体）と、ボタンを使う場合は MESSAGE_COMPONENT の分岐を追加。
3. **`npm test` を実行**し全件パスを確認する。
4. **push する**（mainへのpushで自動デプロイされる。デプロイ完了は GitHub Actions の build 成功で確認）。
5. **コマンド定義を Discord に登録する**
   - `scripts/register-discord-commands.mjs` の定義を更新してから、GitHub Actions「Discordコマンドを登録」（`.github/workflows/register-commands.yml`）を Run workflow で実行する。必要な Secrets（`DISCORD_APP_ID` / `DISCORD_BOT_TOKEN`）は登録済み。
   - ロジックだけの変更でコマンド定義（名前・引数・選択肢）が変わらない場合、この手順は不要。
6. **反映を待って実機確認する**
   - global登録の反映は最大1時間。急ぐ場合は guild_id を指定して再実行すると即時反映される。

## 判断基準・デフォルト値

- 認可は **fail-closed**（許可リストに無ければ拒否）＋オーナー専用を維持する。
- 書き込み系API（カレンダー等）には呼び出し回数の上限ガードを必ず入れる（CLAUDE.md §3）。
- embed.title は256字上限。ユーザー入力をタイトルに載せる場合は `max_length: 100` などで入力側を制限する（実績: code-review指摘 → commit bade9e8 で対応）。
- 確認→確定の2段フローで状態を持ち回る場合、KVを導入せず **ephemeral の embed＋ボタン custom_id への encode で往復**するのが既定（実績: commit 2e2b1a4）。custom_id は100字上限に注意。
- このスキルにデザイン・ブランド固有の記述を持ち込まない（CLAUDE.md §4 デザインの局所性）。

## 例

- 良い例: 日付選択ロジックを `datetime.ts` に `buildWhenFromParts()` として追加し、`tests/datetime.test.ts` で存在しない日付（2/30）の拒否を先にテストしてから `interactions.ts` に配線した。
- 悪い例: `interactions.ts` の分岐内に日付計算を直書きし、テストなしでpushした（ロジックがテスト不能になり、冪等性・境界チェックが検証できない）。

## 完了条件（すべて観測可能であること）

- [ ] `npm test` 全件パス
- [ ] build の Actions run 成功（＝本番デプロイ済み）
- [ ] コマンド定義を変えた場合: 「Discordコマンドを登録」の Actions run 成功
- [ ] Discord実機でコマンドが新仕様どおり応答する（ユーザーに確認手順を提示して確認してもらう）
