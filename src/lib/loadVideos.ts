/**
 * ビルド時にYouTube Data API v3から動画・再生リスト・ライブ状態を読み込む入口。
 * 取得に失敗した場合は例外を投げてビルドごと失敗させる（前回の正常デプロイを残す。CLAUDE.md §4）。
 *
 * クォータ厳守（無料枠1万ユニット/日。CLAUDE.md §1-4 暴走防止）:
 * 高コストな search.list(100u) は使わず、channels/playlistItems/playlists/videos(各1u)だけで構成する。
 * 1ビルドあたり概ね 4 + 再生リスト数（最大MAX_PLAYLISTS）ユニット。
 */
import { fetchJson, type JsonFetcher } from './fetcher';
import {
  parseUploadsPlaylistId,
  parsePlaylistItems,
  parsePlaylists,
  parseLiveStatus,
  parseVideosById,
  sortByNewest,
  type Video,
  type VideoPlaylist,
  type LiveStatus,
} from './youtube';
import { site } from '../config/site';
import { featuredVideoIds } from '../config/featured';

/** トップ/動画ページに出す最新動画の最大件数 */
export const MAX_LATEST = 12;
/** ミラーする公開再生リストの最大数（暴走防止のキャップ） */
export const MAX_PLAYLISTS = 10;
/** 各再生リストから取得する動画の最大件数 */
export const MAX_PER_PLAYLIST = 12;
/** ライブ判定で確認する最新動画の件数（1回のvideos.listで足りる範囲） */
const LIVE_CHECK_COUNT = 10;

const API = 'https://www.googleapis.com/youtube/v3';

export interface VideosData {
  latest: Video[];
  playlists: VideoPlaylist[];
  live: LiveStatus;
  /** おすすめ（PICK UP）に出す動画。固定指定があればその順、無ければ最新上位3本。 */
  featured: Video[];
}

/** おすすめ固定動画の最大数（暴走防止のキャップ） */
const MAX_FEATURED = 5;

function apiKey(): string {
  const k = import.meta.env?.YOUTUBE_API_KEY ?? process.env.YOUTUBE_API_KEY;
  if (!k) {
    throw new Error(
      'YOUTUBE_API_KEY が設定されていません。.env に設定してください（手順: docs/setup/05-youtube-api.md）',
    );
  }
  return k;
}

function channelId(): string {
  const id = site.sources.youtubeChannelId;
  if (!id) {
    throw new Error(
      'YouTubeチャンネルIDが設定されていません。src/config/site.ts の sources.youtubeChannelId を設定してください（手順: docs/setup/05-youtube-api.md）',
    );
  }
  return id;
}

function apiUrl(path: string, params: Record<string, string>, key: string): string {
  const u = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set('key', key);
  return u.toString();
}

/** テストや再利用のための本体（fetcherを差し替え可能） */
export async function loadVideosWith(fetcher: JsonFetcher): Promise<VideosData> {
  const key = apiKey();
  const cid = channelId();

  // 1. uploads（最新アップロード）再生リストIDを取得
  const channelsJson = await fetcher(apiUrl('channels', { part: 'contentDetails', id: cid }, key));
  const uploadsId = parseUploadsPlaylistId(channelsJson);
  if (!uploadsId) {
    throw new Error(
      `YouTubeチャンネルが見つかりません（チャンネルID: ${cid}）。site.ts の youtubeChannelId を確認してください`,
    );
  }

  // 2. 最新アップロード一覧（1ユニットで最大50件取得 → 新しい順に並べ替えて上位だけ採用）
  const uploadsJson = await fetcher(
    apiUrl('playlistItems', { part: 'snippet,contentDetails', playlistId: uploadsId, maxResults: '50' }, key),
  );
  const latest = sortByNewest(parsePlaylistItems(uploadsJson)).slice(0, MAX_LATEST);

  // 3. 公開再生リスト一覧（上限キャップ）
  const playlistsJson = await fetcher(
    apiUrl('playlists', { part: 'snippet', channelId: cid, maxResults: '50' }, key),
  );
  const playlistMetas = parsePlaylists(playlistsJson).slice(0, MAX_PLAYLISTS);

  // 4. 各再生リストの動画（並列・各上限キャップ）。
  //    再生リスト別表示は補助的なので、一部リストの取得失敗は致命的にしない（allSettledで成功分だけ使う）。
  //    中核データ（最新動画=uploads）の失敗は上の await で例外→ビルド失敗のまま（§4）。
  const settled = await Promise.allSettled(
    playlistMetas.map(async (pl) => {
      const itemsJson = await fetcher(
        apiUrl(
          'playlistItems',
          { part: 'snippet,contentDetails', playlistId: pl.id, maxResults: String(MAX_PER_PLAYLIST) },
          key,
        ),
      );
      return { id: pl.id, title: pl.title, videos: parsePlaylistItems(itemsJson).slice(0, MAX_PER_PLAYLIST) };
    }),
  );
  const playlists: VideoPlaylist[] = settled
    .filter((r): r is PromiseFulfilledResult<VideoPlaylist> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((pl) => pl.videos.length > 0);

  // 5. ライブ中判定（最新動画 数件だけ確認＝クォータ節約。ライブ枠は最新側に現れる）。
  //    ライブバッジは補助表示なので、判定取得の失敗ではビルドを落とさない（非ライブ扱いで継続）。
  let live: LiveStatus = { isLive: false, liveVideo: null };
  const liveCheckIds = latest.slice(0, LIVE_CHECK_COUNT).map((v) => v.id);
  if (liveCheckIds.length > 0) {
    try {
      const videosJson = await fetcher(apiUrl('videos', { part: 'snippet', id: liveCheckIds.join(',') }, key));
      live = parseLiveStatus(videosJson);
    } catch {
      live = { isLive: false, liveVideo: null };
    }
  }

  // 6. おすすめ（PICK UP）。固定指定があれば指定IDを取得し設定順に並べる（videos.list=1ユニット）。
  //    PICK UPは補助表示なので、取得失敗・一部欠落時は最新上位3本にフォールバック（ビルドは落とさない）。
  let featured: Video[] = latest.slice(0, 3);
  if (featuredVideoIds.length > 0) {
    try {
      const ids = featuredVideoIds.slice(0, MAX_FEATURED);
      const videosJson = await fetcher(apiUrl('videos', { part: 'snippet', id: ids.join(',') }, key));
      const byId = new Map(parseVideosById(videosJson).map((v) => [v.id, v]));
      const picked = ids.map((id) => byId.get(id)).filter((v): v is Video => v !== undefined);
      if (picked.length > 0) featured = picked;
    } catch {
      // フォールバック（latest上位3本のまま）
    }
  }

  return { latest, playlists, live, featured };
}

// トップと動画ページの両方から呼ばれるため結果を使い回す（取得は1回だけ）。
// dev中もキャッシュする：YouTubeはクォータ、BOOTHはアクセス制限があるため、リロードのたびに叩かない。
// （site.ts や lib を編集するとモジュールが再読込されキャッシュも自然にリセットされる）
let cache: Promise<VideosData> | null = null;

export function loadVideos(): Promise<VideosData> {
  cache ??= loadVideosWith(fetchJson);
  return cache;
}
