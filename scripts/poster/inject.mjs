// ポスターHTMLテンプレに WEEK / schedule を差し込み、撮影用スタイルを挿入する純関数。
// make-poster.mjs から使う。テンプレ側のプレースホルダ（const WEEK = {…}; / const schedule = […];）を
// 正規表現で見つけ、JSON で置き換える。
//
// 置換値は必ず「関数で返す」こと（第2引数を文字列にしない）。文字列置換だと JSON 内の
// $&, $1, $` などが String.replace の特殊シーケンスとして解釈され、タイトルに $ を含むと壊れる。
// 関数置換ならそのままリテラルとして入る。HTMLエスケープは描画側(template.html)で行う（D-08）。

/**
 * @param {string} tpl テンプレHTML（poster/template.html の内容）
 * @param {{ month: string, range: string, schedule: unknown[] }} data 差し込むWEEK情報と日別配列
 * @param {string} fitStyle </head> 直前に差し込む撮影用スタイル（末尾に </head> を含む）
 * @returns {string} 差し込み後のHTML
 */
export function injectPosterData(tpl, { month, range, schedule }, fitStyle) {
  return tpl
    .replace(/const WEEK = \{[^}]*\};/, () => `const WEEK = ${JSON.stringify({ month, range })};`)
    .replace(/const schedule = \[[\s\S]*?\];/, () => `const schedule = ${JSON.stringify(schedule)};`)
    .replace('</head>', () => fitStyle);
}
