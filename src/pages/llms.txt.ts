import type { APIRoute } from 'astro';
import { site } from '../config/site';

// AI検索向けの索引（llms.txt）。サイト概要＋主要ページ＋公式リンクを簡潔に。
export const GET: APIRoute = ({ site: astroSite }) => {
  const base = (astroSite?.toString() ?? 'https://wakamatsu-iori.com/').replace(/\/$/, '');
  const body = `# ${site.name}

> ${site.description}

## 主要ページ
- [トップ](${base}/): ライブ中バッジ／次の配信／最新動画／プロフィール
- [スケジュール](${base}/schedule/): 配信予定（Googleカレンダー連動・自動更新）
- [動画](${base}/videos/): 最新動画・再生リスト（ゲーム/歌/雑談などに自動仕分け）
- [グッズ](${base}/goods/): BOOTHのグッズ一覧（購入はBOOTHへ）
- [プロフィール](${base}/about/): カフェ＆バーの店長・個人勢VTuber 和香松 庵 の紹介
- [お仕事のご依頼](${base}/work/): コラボ・企業案件のご相談
- [ガイドライン](${base}/guidelines/): 二次創作・ファンアート・切り抜きのルール

## 公式リンク
- YouTube: ${site.links.youtube}
- X (Twitter): ${site.links.x}
- BOOTH: ${site.links.booth}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
