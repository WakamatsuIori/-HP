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
  /** リンク先（外部URL or サイト内パス /schedule など） */
  url: string;
  /** バナー画像URL（任意）。public/配下のパスや外部URL。無ければ既定デザイン */
  image?: string;
}

export const information: InfoItem[] = [
  {
    date: '2026.06.14',
    category: 'info',
    title: '公式サイトをリニューアルしました！',
    url: '#top',
  },
  {
    date: '2026.06.14',
    category: 'stream',
    title: '今週・来週の配信スケジュールを公開中',
    url: '/schedule',
  },
];
