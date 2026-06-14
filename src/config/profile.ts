/**
 * PROFILEセクションの表示データ。
 * 「あいさつ文（intro）」と「プロフィール項目（profile）」を分けて管理する。
 * ※ あいさつ文はあとで本決め予定。intro だけ書き換えればトップに反映される。
 */
export interface ProfileRow {
  label: string;
  value: string;
}

/** あいさつ文：キャッチコピー＋英文＋紹介文（地の文）。あとで差し替え可。 */
export const intro = {
  /** キャッチコピー（配列の要素間で改行＝<br>） */
  catchLines: ['ちょっと一杯、', '寄っていきませんか？'],
  catchEn: 'Care for a drink with me, tonight ...?',
  /** 紹介文（段落ごとに1要素） */
  story: [
    'カフェ＆バー「Bar Bluebell」の店長をしている、個人勢VTuberの和香松 庵です。',
    '雑談とゲームを肴に、夜のひとときをゆるりとお届け。気が向けば、歌うことも。',
    '「ただいま」も「はじめまして」も大歓迎。グラス片手に、肩の力を抜いて過ごせる隠れ家を目指しています。',
    '今日あった他愛もない話も、好きなものの早口も。あなたの夜に、そっと寄り添えたら嬉しいです。',
  ],
};

/** プロフィール項目（dt/dd）とジャンルタグ。 */
export const profile = {
  rows: [
    { label: '名前', value: '和香松 庵（わかまつ いおり）' },
    { label: '設定', value: 'カフェ＆バーの店長' },
    { label: '誕生日', value: '12月15日' },
    { label: '身長', value: '171cm' },
    { label: '配信内容', value: '雑談・ゲーム・作業配信' },
    { label: '好きなもの', value: 'ゲーム・甘い物・スキンケア・お酒' },
    { label: '趣味', value: '配信・ゲーム・仕組み作り・釣り' },
    { label: 'ファンネーム', value: '募集中' },
    { label: 'ハッシュタグ', value: '#和香松庵 ／ #ほろ酔い庵' },
  ] satisfies ProfileRow[],
  /** 配信ジャンルのタグ */
  chips: ['雑談', 'ゲーム実況', 'いろいろ挑戦'],
};
