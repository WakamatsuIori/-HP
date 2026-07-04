/**
 * 配信告知ページ（/live/<slug>/）の一覧。1配信 = 1エントリを上に追記する。
 *
 * 使い方：
 * 1. 下の配列にエントリを1つ足す（slug は「YYYY-MM-DD-英単語」形式で毎回変える。
 *    Xのカードキャッシュを避けるため、同じURLを使い回さない）。
 * 2. main へ push（または Discord の /更新）でビルドされ、
 *    https://wakamatsu-iori.com/live/<slug>/ が公開される。
 * 3. そのURLをXに投稿すると大きい画像カード（summary_large_image）で表示される。
 *
 * カード画像の優先順位：image 指定 > YouTubeサムネ（youtubeUrl から自動）> 共通 /og.jpg。
 * ※YouTubeサムネは maxresdefault を使う。カードに画像が出ない場合はサムネ未生成なので
 *   image に画像URLを明示する。
 */
export interface LivePage {
  /** URLの一部。「YYYY-MM-DD-英単語」形式（例 2026-07-10-zatsudan） */
  slug: string;
  /** カードと見出しに出るタイトル */
  title: string;
  /** カードの説明文（1〜2文） */
  description: string;
  /** YouTubeの視聴URL（配信前は待機所URLでOK） */
  youtubeUrl: string;
  /** 配信日時の表示用文字列（例 7/10(金) 21:00〜） */
  when: string;
  /** カード画像（任意）。サイト内パス（/info/xxx.png）か絶対URL */
  image?: string;
}

export const livePages: LivePage[] = [
  // 新しい配信を告知するときは、この行の下にエントリを追記する。
  {
    slug: '2026-07-04-card-test',
    title: '【テスト】配信告知カードの表示確認',
    description: 'Xカード表示のテスト用ページです。実際の配信告知はこの仕組みで発行します。',
    youtubeUrl: 'https://www.youtube.com/@Wakamatsu-Iori/streams',
    when: '（テストページ・実配信ではありません）',
  },
];

/** youtubeUrl から動画IDを取り出す（youtu.be / watch?v= / live/ 形式に対応）。取れなければ null */
export function youtubeVideoId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/))([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/,
  );
  return m ? m[1] : null;
}

/** 告知カードに使う画像URLを決める（image 指定 > YouTubeサムネ > 共通 /og.jpg） */
export function livePageImage(p: Pick<LivePage, 'image' | 'youtubeUrl'>): string {
  if (p.image) return p.image;
  const id = youtubeVideoId(p.youtubeUrl);
  return id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : '/og.jpg';
}
