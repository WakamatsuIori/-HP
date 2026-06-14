// ポスターHTMLテンプレに WEEK / schedule を差し込み、撮影用スタイルを挿入する純関数。
// make-poster.mjs から使う。差し込み方法（正規表現置換）は従来どおりで、出力は不変。
// ※ ここはテスト可能にするための切り出しのみ。差し込み方式そのものの見直しは別タスク（D-17）、
//    タイトルのHTMLエスケープは別タスク（D-08）で扱う。

/**
 * @param {string} tpl テンプレHTML（poster/template.html の内容）
 * @param {{ month: string, range: string, schedule: unknown[] }} data 差し込むWEEK情報と日別配列
 * @param {string} fitStyle </head> 直前に差し込む撮影用スタイル（末尾に </head> を含む）
 * @returns {string} 差し込み後のHTML
 */
export function injectPosterData(tpl, { month, range, schedule }, fitStyle) {
  return tpl
    .replace(/const WEEK = \{[^}]*\};/, `const WEEK = ${JSON.stringify({ month, range })};`)
    .replace(/const schedule = \[[\s\S]*?\];/, `const schedule = ${JSON.stringify(schedule)};`)
    .replace('</head>', fitStyle);
}
