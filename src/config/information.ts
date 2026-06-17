/**
 * INFORMATION（お知らせ）の中身。ここを編集すればHPのお知らせカードが変わる。
 * image を空にすると、カテゴリ名入りの既定デザイン（金×黒）で表示される。
 */
export interface InfoItem {
  /** 例 "2026.06.14" */
  date: string;
  /** 自由なラベル（例 info / goods / stream / song） */
  category: string;
  title: string;
  /** リンク先（外部URL or サイト内パス /schedule など）。省略すると「表示だけ（リンク無し）」になる。 */
  url?: string;
  /** バナー画像URL（任意）。public/配下のパスや外部URL。無ければ既定デザイン */
  image?: string;
}

export const information: InfoItem[] = [
  // 新しい順に上から。1件でも書くとトップのお知らせカードと /news に反映される。
  {
    date: '2026.06.18',
    category: 'goods',
    title: 'グッズ制作！？ 6/19(金)の配信でいっしょに考えよう！',
    url: '/schedule',
    image: '/info/goods.png',
  },
  {
    date: '2026.06.18',
    category: 'costume',
    title: '新衣装計画、進行中…！',
    image: '/info/costume.svg',
  },
  {
    date: '2026.06.18',
    category: 'info',
    title: '公式サイトを公開しました！',
    image: '/info/open.svg',
  },
  // 追加例: { date: '2026.06.20', category: 'info', title: 'タイトル', url: 'https://example.com/...' },
];
