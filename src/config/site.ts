/**
 * サイト全体の設定。本人情報が確定したらこのファイルだけ書き換えれば全ページに反映される。
 * ※APIキー等の秘密情報はここに書かない（それらは .env / GitHub Secrets で管理）
 */
export const site = {
  /** VTuber名（配信用の活動名） */
  name: '和香松庵',
  /** サイトの1行説明 */
  description: 'VTuber・和香松庵の公式サイト。配信予定・動画・グッズ・お仕事のご依頼はこちらから。',
  /** トップの主役画像。本物の立ち絵ができたら public/ に画像を置いてこのパスを差し替える（今は仮のシルエット） */
  heroImage: '/hero-silhouette.svg',
  /** 公式リンク（なりすまし対策として全ページから参照する） */
  links: {
    youtube: 'https://www.youtube.com/@example-channel',
    x: 'https://x.com/example',
    booth: 'https://example.booth.pm/',
  },
} as const;
