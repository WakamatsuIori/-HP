import { describe, it, expect } from 'vitest';
// @ts-expect-error .mjs スクリプト（型定義なし）を直接読み込む
import { injectPosterData } from '../scripts/poster/inject.mjs';

// テンプレの該当箇所だけを模した最小HTML。実テンプレと同じ形の placeholder を持つ。
const TPL = [
  '<html><head><title>poster</title></head>',
  '<body><script>',
  "const WEEK = { month: 'X', range: 'Y' };",
  "const schedule = [ { ja: '月', date: '6/15', time: '', title: 'placeholder', featured: false } ];",
  '</script></body></html>',
].join('\n');

const FIT = '<style id="fit">x</style></head>';

describe('injectPosterData', () => {
  it('WEEK を month/range のJSONで置換する', () => {
    const out = injectPosterData(TPL, { month: 'JUNE 2026', range: '6/15 〜 6/21', schedule: [] }, FIT);
    expect(out).toContain('const WEEK = {"month":"JUNE 2026","range":"6/15 〜 6/21"};');
    // 元の placeholder は消える
    expect(out).not.toContain("month: 'X'");
  });

  it('schedule を配列のJSONで置換する', () => {
    const schedule = [{ ja: '火', date: '6/16', time: '21:00', title: 'ゲーム配信', featured: true }];
    const out = injectPosterData(TPL, { month: 'M', range: 'R', schedule }, FIT);
    expect(out).toContain(`const schedule = ${JSON.stringify(schedule)};`);
    expect(out).not.toContain("title: 'placeholder'");
  });

  it('撮影用スタイルが </head> 位置に差し込まれる', () => {
    const out = injectPosterData(TPL, { month: 'M', range: 'R', schedule: [] }, FIT);
    expect(out).toContain(FIT);
    // 差し込み前の素の </head> は1つ（FIT末尾のもの）だけになる
    expect(out.match(/<\/head>/g)).toHaveLength(1);
  });

  it('タイトルに } ] < " などの特殊文字が来てもJSONとして正しく差し込まれる（破損しない）', () => {
    const schedule = [
      { ja: '水', date: '6/17', time: '20:00', title: 'お絵かき } ] < > " 配信', featured: false },
      { ja: '木', date: '6/18', time: '', title: '配列](壊し)テスト', featured: false },
    ];
    const out = injectPosterData(TPL, { month: 'M', range: 'R', schedule }, FIT);
    const expected = `const schedule = ${JSON.stringify(schedule)};`;
    expect(out).toContain(expected);
    // 差し込み後のHTMLから schedule のJSONを取り出してパースし、タイトルが復元できることを確認
    const injected = out.match(/const schedule = (\[[\s\S]*?\]);/);
    const parsed = JSON.parse(injected![1]);
    expect(parsed[0].title).toBe('お絵かき } ] < > " 配信');
    expect(parsed[1].title).toBe('配列](壊し)テスト');
  });

  it('タイトルに $&, $1, $` などの置換特殊シーケンスが来ても壊れない（D-17）', () => {
    const schedule = [{ ja: '金', date: '6/19', time: '21:00', title: '賞金 $1,000,000 $& $` 企画', featured: true }];
    const out = injectPosterData(TPL, { month: 'M', range: 'R', schedule }, FIT);
    // 関数置換なので JSON はそのままリテラルで入る（文字列置換だと $ シーケンスが展開され壊れる）
    expect(out).toContain(`const schedule = ${JSON.stringify(schedule)};`);
  });
});
