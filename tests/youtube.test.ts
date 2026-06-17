import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseUploadsPlaylistId,
  parsePlaylistItems,
  parsePlaylists,
  parseLiveStatus,
  parseVideosById,
  sortByNewest,
} from '../src/lib/youtube';

function fx(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, 'fixtures', name), 'utf-8'));
}

describe('parseUploadsPlaylistId', () => {
  it('channels.listからuploads再生リストIDを取り出す', () => {
    expect(parseUploadsPlaylistId(fx('youtube-channels.json'))).toBe('UUabc123');
  });
  it('該当が無ければnull', () => {
    expect(parseUploadsPlaylistId({ items: [] })).toBeNull();
    expect(parseUploadsPlaylistId({})).toBeNull();
    expect(parseUploadsPlaylistId(null)).toBeNull();
  });
});

describe('parsePlaylistItems', () => {
  const videos = parsePlaylistItems(fx('youtube-playlist-items.json'));

  it('削除/非公開動画を除外し、重複IDを排除する', () => {
    expect(videos.map((v) => v.id)).toEqual(['vid_new', 'vid_song']);
  });
  it('視聴URLを組み立てる', () => {
    expect(videos[0]!.url).toBe('https://www.youtube.com/watch?v=vid_new');
  });
  it('サムネが無ければYouTube既定サムネにフォールバックする', () => {
    expect(videos[1]!.thumbnailUrl).toBe('https://i.ytimg.com/vi/vid_song/hqdefault.jpg');
  });
  it('publishedAtを日付化する', () => {
    expect(videos[0]!.publishedAt?.toISOString()).toBe('2026-06-12T10:00:00.000Z');
  });
});

describe('sortByNewest', () => {
  it('公開日時の新しい順に並べる', () => {
    const videos = parsePlaylistItems(fx('youtube-playlist-items.json'));
    expect(sortByNewest(videos).map((v) => v.id)).toEqual(['vid_new', 'vid_song']);
  });
});

describe('parsePlaylists', () => {
  it('タイトルのある公開再生リストだけ返す', () => {
    expect(parsePlaylists(fx('youtube-playlists.json'))).toEqual([
      { id: 'PL_game', title: 'ゲーム実況' },
      { id: 'PL_song', title: '歌枠アーカイブ' },
    ]);
  });
});

describe('parseVideosById', () => {
  it('videos.list の item.id を動画IDとして Video[] に変換する', () => {
    const videos = parseVideosById({
      items: [
        { id: 'aaa', snippet: { title: 'A', publishedAt: '2026-06-10T00:00:00Z' } },
        { id: 'bbb', snippet: { title: 'B', thumbnails: { high: { url: 'https://x/b.jpg' } } } },
      ],
    });
    expect(videos.map((v) => v.id)).toEqual(['aaa', 'bbb']);
    expect(videos[0]!.url).toBe('https://www.youtube.com/watch?v=aaa');
    expect(videos[1]!.thumbnailUrl).toBe('https://x/b.jpg');
  });
  it('無題・削除/非公開・id欠落は除外する', () => {
    const videos = parseVideosById({
      items: [
        { id: 'ok', snippet: { title: 'OK' } },
        { snippet: { title: 'no id' } },
        { id: 'empty', snippet: { title: '   ' } },
        { id: 'del', snippet: { title: 'Deleted video' } },
      ],
    });
    expect(videos.map((v) => v.id)).toEqual(['ok']);
  });
});

describe('parseLiveStatus', () => {
  it('liveBroadcastContent==="live" の動画をライブ中とする', () => {
    const s = parseLiveStatus(fx('youtube-videos-live.json'));
    expect(s.isLive).toBe(true);
    expect(s.liveVideo?.id).toBe('vid_live');
    expect(s.liveVideo?.url).toBe('https://www.youtube.com/watch?v=vid_live');
  });
  it('upcoming/none/空はライブ扱いしない', () => {
    expect(parseLiveStatus({ items: [{ id: 'y', snippet: { liveBroadcastContent: 'upcoming' } }] }).isLive).toBe(false);
    expect(parseLiveStatus({ items: [{ id: 'z', snippet: { liveBroadcastContent: 'none' } }] }).isLive).toBe(false);
    expect(parseLiveStatus({ items: [] }).isLive).toBe(false);
  });
});
