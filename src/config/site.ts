/**
 * サイト全体の設定。本人情報が確定したらこのファイルだけ書き換えれば全ページに反映される。
 * ※APIキー等の秘密情報はここに書かない（それらは .env / GitHub Secrets で管理）
 */
export const site = {
  /** VTuber名（配信用の活動名） */
  name: '和香松庵',
  /** サイトの1行説明 */
  description: 'VTuber・和香松庵の公式サイト。配信予定・動画・グッズ・お仕事のご依頼はこちらから。',
  /** 公式リンク（なりすまし対策として全ページから参照する） */
  links: {
    youtube: 'https://www.youtube.com/@Wakamatsu-Iori',
    x: 'https://x.com/WakamatsuIori',
    booth: 'https://wakamatsu-iori.booth.pm/',
    /** マシュマロ（匿名で質問・メッセージを受け取る） */
    marshmallow: 'https://marshmallow-qa.com/wakamatsu_vt',
  },
  /**
   * 自動掲載のデータ取得元（いずれも公開情報。APIキー等の秘密は .env / GitHub Secrets で管理）。
   * 本人の値が決まったらここに設定する。空のままだと該当機能のビルドが失敗する（設定漏れに気づける）。
   */
  sources: {
    /** YouTubeチャンネルID（UCで始まる24文字）。動画一覧・ライブ検知に使用。取得: docs/setup/05-youtube-api.md */
    youtubeChannelId: 'UC_7ehPcs0J67P-5k-qJmjmA',
    /** BOOTHショップのRSSフィードURL（例: https://〇〇.booth.pm/items.rss）。取得: docs/setup/06-booth-feed.md */
    boothFeedUrl: 'https://wakamatsu-iori.booth.pm/items.rss',
  },
} as const;
