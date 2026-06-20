/**
 * ライブ中バッジの「訪問時チェック」受け口（Cloudflare Pages Function）。
 * 公開URL: https://<サイト>/api/live  → { isLive, liveVideo:{ id,title,url,... } | null } をJSONで返す。
 *
 * ・YouTubeへの問い合わせはサーバー側だけで行い、APIキーはブラウザに渡さない（CLAUDE.md §3）。
 * ・edgeキャッシュ120秒：同一コロ宛の連続アクセスは2分に1回しかYouTubeを叩かない（クォータ安全）。
 * ・取得失敗・キー未設定時は「非ライブ」を短めキャッシュで返す＝ページは壊さない（§4フォールバック）。
 *   ライブバッジは補助表示なので、判定が取れない時はバッジを出さないだけで構造データの公開は止めない。
 */
import { resolveLiveStatus } from '../../src/lib/live';
import { fetchJson } from '../../src/lib/fetcher';
import { site } from '../../src/config/site';

interface Env {
  /** YouTube Data API キー。Cloudflare Pages の環境変数に設定（GitHub Secret とは別に必要）。 */
  YOUTUBE_API_KEY?: string;
}

interface Ctx {
  request: Request;
  env: Env;
  waitUntil(p: Promise<unknown>): void;
}

export async function onRequestGet(ctx: Ctx): Promise<Response> {
  const { request, env, waitUntil } = ctx;

  // Cloudflareのedgeキャッシュ。クエリ等を無視してURLを正規化し、ヒット率を上げる。
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(`${new URL(request.url).origin}/api/live`, { method: 'GET' });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const { live, ttlSeconds } = await resolveLiveStatus(fetchJson, env.YOUTUBE_API_KEY, site.sources.youtubeChannelId);

  const res = new Response(JSON.stringify(live), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // edgeは s-maxage 秒キャッシュ（クォータ節約）／ブラウザは毎回再検証（古い点灯/消灯を持ち越さない）。
      'cache-control': `public, s-maxage=${ttlSeconds}, max-age=0`,
    },
  });
  // edgeにも保存（レスポンス返却をブロックしないようwaitUntilで）
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
