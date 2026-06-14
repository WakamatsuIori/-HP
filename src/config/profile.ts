/**
 * PROFILEセクションの表示データ。〇〇・「（仮）」はオーナー確定後に差し替える。
 * index.astro から分離して編集しやすくしたもの。出力HTMLは従来と同じ。
 * ※ 紹介文（welcome__story の段落・inline装飾あり）は地の文なので index.astro 側に置いたまま。
 */
export interface ProfileRow {
  label: string;
  value: string;
}

export const profile = {
  /** キャッチコピー（配列の要素間で改行＝<br>） */
  catchLines: ['ちょっと一杯、', '寄っていきませんか？'],
  catchEn: 'Care for a drink with me, tonight ...?',
  /** プロフィール項目（dt/dd）。〇〇/（仮）はオーナー確定待ち。 */
  rows: [
    { label: '名前', value: '和香松 庵（わかまつ いおり）' },
    { label: '設定', value: 'カフェ＆バーの店長' },
    { label: '誕生日', value: '〇月〇日（仮）' },
    { label: '身長', value: '〇〇cm（仮）' },
    { label: '配信内容', value: '雑談・ゲーム・歌（仮）' },
    { label: '好きなもの', value: 'お酒・カクテル・〇〇（仮）' },
    { label: 'ファンネーム', value: '〇〇（仮）' },
    { label: 'ハッシュタグ', value: '#和香松庵 ／ #〇〇（仮）' },
  ] satisfies ProfileRow[],
  /** 配信ジャンルのタグ */
  chips: ['雑談', 'ゲーム実況', 'いろいろ挑戦'],
};
