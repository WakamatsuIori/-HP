/**
 * ライブ中バッジの「訪問時チェック」用：YouTubeに“今ライブ中か”だけを軽く問い合わせる。
 *
 * ・Cloudflare Pages Function（functions/api/live.ts）から呼ぶ前提。Worker実行環境のため
 *   import.meta.env / process / Node API には依存しない（key・channelId は引数で受け取る）。
 * ・判定ロジック自体は既存の youtube.ts（parseLiveStatus 等）を再利用＝二重実装しない。
 * ・クォータ最小（channels=1 + playlistItems=1 + videos=1 ≒ 3ユニット/回）。search.list は使わない。
 */
import type { JsonFetcher } from './fetcher';
import { parseUploadsPlaylistId, parsePlaylistItems, parseLiveStatus, sortByNewest, type LiveStatus } from './youtube';

const API = 'https://www.googleapis.com/youtube/v3';

/** ライブ判定で確認する最新動画の件数（1回の videos.list で足りる範囲。ライブ枠は最新側に出る） */
const LIVE_CHECK_COUNT = 10;

const OFFLINE: LiveStatus = { isLive: false, liveVideo: null };

function apiUrl(path: string, params: Record<string, string>, key: string): string {
  const u = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set('key', key);
  return u.toString();
}

/**
 * 今ライブ中の配信枠を返す。ライブでなければ { isLive:false, liveVideo:null }。
 * 取得失敗は呼び出し側（受け口）で握りつぶす想定なので、ここでは例外をそのまま投げる。
 * fetcher を差し替え可能にしてテスト可能にする。
 */
export async function loadLiveStatusWith(fetcher: JsonFetcher, key: string, channelId: string): Promise<LiveStatus> {
  // 1. uploads（最新アップロード）再生リストID
  const channelsJson = await fetcher(apiUrl('channels', { part: 'contentDetails', id: channelId }, key));
  const uploadsId = parseUploadsPlaylistId(channelsJson);
  if (!uploadsId) return OFFLINE;

  // 2. 最新アップロード（新しい順に並べ替えて先頭だけ見る）
  const uploadsJson = await fetcher(
    apiUrl('playlistItems', { part: 'snippet,contentDetails', playlistId: uploadsId, maxResults: '50' }, key),
  );
  const ids = sortByNewest(parsePlaylistItems(uploadsJson))
    .slice(0, LIVE_CHECK_COUNT)
    .map((v) => v.id);
  if (ids.length === 0) return OFFLINE;

  // 3. ライブ中判定（videos.list=1ユニット）
  const videosJson = await fetcher(apiUrl('videos', { part: 'snippet', id: ids.join(',') }, key));
  return parseLiveStatus(videosJson);
}

export interface ResolvedLive {
  live: LiveStatus;
  /** レスポンスのキャッシュ秒数（成功=長め／失敗・未設定=短めで早期回復） */
  ttlSeconds: number;
}

/**
 * 受け口（functions/api/live.ts）用の薄いラッパ。フォールバック判断をここに集約してテスト可能にする（§4）。
 * ・キー/チャンネルID未設定 → 非ライブ＋短TTL（設定後すぐ反映されるように）
 * ・取得成功 → ライブ状態＋通常TTL
 * ・取得失敗 → 例外は投げず非ライブ＋短TTL（バッジは出さないだけ＝ページを壊さない）
 */
export async function resolveLiveStatus(
  fetcher: JsonFetcher,
  key: string | undefined,
  channelId: string | undefined,
): Promise<ResolvedLive> {
  if (!key || !channelId) return { live: OFFLINE, ttlSeconds: 30 };
  try {
    return { live: await loadLiveStatusWith(fetcher, key, channelId), ttlSeconds: 120 };
  } catch {
    return { live: OFFLINE, ttlSeconds: 30 };
  }
}
