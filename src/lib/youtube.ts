/**
 * YouTube Data API v3 のレスポンス(JSON)を解析する純関数群。通信・副作用なし。
 * APIキー・チャンネルIDはここでは扱わない（取得は loadVideos.ts）。
 * 外部由来のタイトル等は信頼しないデータとして扱い、表示側(Astro)の自動エスケープに渡す（CLAUDE.md §3）。
 */

export interface Video {
  /** 動画ID */
  id: string;
  /** タイトル */
  title: string;
  /** 視聴URL（YouTube） */
  url: string;
  /** サムネイルURL */
  thumbnailUrl: string;
  /** 公開日時（取れなければ null） */
  publishedAt: Date | null;
}

export interface VideoPlaylist {
  id: string;
  title: string;
  videos: Video[];
}

export interface LiveStatus {
  isLive: boolean;
  /** ライブ中の動画（バッジのリンク先）。ライブでなければ null */
  liveVideo: Video | null;
}

// --- API生レスポンスの最小型（必要なフィールドのみ・すべて任意） ---
interface RawThumb {
  url?: string;
}
interface RawSnippet {
  title?: string;
  publishedAt?: string;
  liveBroadcastContent?: string;
  resourceId?: { videoId?: string };
  thumbnails?: Record<string, RawThumb | undefined>;
}
interface RawItem {
  id?: string;
  snippet?: RawSnippet;
  contentDetails?: {
    videoId?: string;
    videoPublishedAt?: string;
    relatedPlaylists?: { uploads?: string };
  };
}
interface RawListResponse {
  items?: RawItem[];
}

/** 削除/非公開動画のタイトル（YouTubeが返す固定文言）。一覧から除外する。 */
const PLACEHOLDER_TITLES = new Set(['Deleted video', 'Private video', 'This video is private']);

function asList(json: unknown): RawItem[] {
  const items = (json as RawListResponse | null)?.items;
  return Array.isArray(items) ? items : [];
}

function videoUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

function pickThumbnail(id: string, thumbs?: Record<string, RawThumb | undefined>): string {
  for (const k of ['maxres', 'standard', 'high', 'medium', 'default']) {
    const u = thumbs?.[k]?.url;
    if (u) return u;
  }
  // APIにサムネが無くてもYouTubeの既定サムネは必ず存在する
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** channels.list(part=contentDetails) から uploads 再生リストID を取り出す */
export function parseUploadsPlaylistId(json: unknown): string | null {
  for (const item of asList(json)) {
    const id = item.contentDetails?.relatedPlaylists?.uploads;
    if (id) return id;
  }
  return null;
}

/** 動画IDで重複排除（入力順を保持） */
export function dedupeVideos(videos: Video[]): Video[] {
  const seen = new Set<string>();
  const out: Video[] = [];
  for (const v of videos) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out;
}

/** 公開日時の新しい順に並べ替えた新しい配列を返す（null は末尾扱い） */
export function sortByNewest(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
}

/** playlistItems.list(part=snippet,contentDetails) を Video[] に変換（削除/非公開を除外・重複排除） */
export function parsePlaylistItems(json: unknown): Video[] {
  const videos: Video[] = [];
  for (const item of asList(json)) {
    const sn = item.snippet;
    const videoId = item.contentDetails?.videoId ?? sn?.resourceId?.videoId;
    if (!videoId) continue;
    const title = (sn?.title ?? '').trim();
    if (!title || PLACEHOLDER_TITLES.has(title)) continue; // 削除/非公開動画を除外
    videos.push({
      id: videoId,
      title,
      url: videoUrl(videoId),
      thumbnailUrl: pickThumbnail(videoId, sn?.thumbnails),
      publishedAt: parseDate(item.contentDetails?.videoPublishedAt ?? sn?.publishedAt),
    });
  }
  return dedupeVideos(videos);
}

/** videos.list(part=snippet) を Video[] に変換（item.id が動画ID）。削除/非公開・無題は除外・重複排除。 */
export function parseVideosById(json: unknown): Video[] {
  const videos: Video[] = [];
  for (const item of asList(json)) {
    const id = item.id;
    if (!id) continue;
    const sn = item.snippet;
    const title = (sn?.title ?? '').trim();
    if (!title || PLACEHOLDER_TITLES.has(title)) continue; // 削除/非公開動画を除外
    videos.push({
      id,
      title,
      url: videoUrl(id),
      thumbnailUrl: pickThumbnail(id, sn?.thumbnails),
      publishedAt: parseDate(sn?.publishedAt),
    });
  }
  return dedupeVideos(videos);
}

/** playlists.list(part=snippet) を {id,title}[] に変換（タイトルのある公開リストのみ） */
export function parsePlaylists(json: unknown): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = [];
  for (const item of asList(json)) {
    const id = item.id;
    const title = (item.snippet?.title ?? '').trim();
    if (id && title) out.push({ id, title });
  }
  return out;
}

/** videos.list(part=snippet) から「現在ライブ中」を判定 */
export function parseLiveStatus(json: unknown): LiveStatus {
  for (const item of asList(json)) {
    if (item.snippet?.liveBroadcastContent === 'live' && item.id) {
      const id = item.id;
      const title = (item.snippet.title ?? '').trim() || 'ライブ配信中';
      return {
        isLive: true,
        liveVideo: {
          id,
          title,
          url: videoUrl(id),
          thumbnailUrl: pickThumbnail(id, item.snippet.thumbnails),
          publishedAt: parseDate(item.snippet.publishedAt),
        },
      };
    }
  }
  return { isLive: false, liveVideo: null };
}
