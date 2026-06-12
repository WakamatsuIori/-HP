/**
 * サイト全体の設定。本人情報が確定したらこのファイルだけ書き換えれば全ページに反映される。
 * ※APIキー等の秘密情報はここに書かない（それらは .env / GitHub Secrets で管理）
 */
export const site = {
  /** VTuber名（仮） */
  name: 'ミナモ（仮）',
  /** サイトの1行説明 */
  description: 'VTuber ミナモ（仮）の公式サイト。配信予定・動画・グッズ・お仕事のご依頼はこちらから。',
  /** 公式リンク（なりすまし対策として全ページから参照する） */
  links: {
    youtube: 'https://www.youtube.com/@example-channel',
    x: 'https://x.com/example',
    booth: 'https://example.booth.pm/',
  },
} as const;
