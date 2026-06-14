/**
 * 「おすすめ枠」の目印。カレンダー予定の説明欄にこの文字列が含まれると、
 * 週間ボード/ポスターで金色強調＋◆になる。
 *
 * HP表示（src/lib/weekly.ts）と Discord連携（functions/discord/interactions.ts）の
 * 両方がこの値を参照する。ここが唯一の定義（single source of truth）。
 * 依存ゼロの定数だけにして、Cloudflare Workers 側へ重い依存を持ち込まないこと。
 */
export const FEATURED_MARK = '#おすすめ';
