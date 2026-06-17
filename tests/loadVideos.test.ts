import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadVideosWith } from '../src/lib/loadVideos';
import { featuredVideoIds } from '../src/config/featured';

function fx(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, 'fixtures', name), 'utf-8'));
}

/**
 * YouTube APIのモック。URLのパスと playlistId で返すfixtureを切り替える。
 * overrides で特定パスだけ失敗させて、失敗時の振る舞いを検証する。
 */
function makeFetcher(overrides: { throwOn?: (url: string) => boolean } = {}) {
  const calls: string[] = [];
  const fetcher = async (url: string): Promise<unknown> => {
    calls.push(url);
    if (overrides.throwOn?.(url)) throw new Error(`boom: ${url}`);
    const u = new URL(url);
    const path = u.pathname;
    if (path.endsWith('/channels')) return fx('youtube-channels.json');
    if (path.endsWith('/playlists')) return fx('youtube-playlists.json');
    if (path.endsWith('/videos')) return fx('youtube-videos-live.json');
    if (path.endsWith('/playlistItems')) return fx('youtube-playlist-items.json');
    throw new Error(`unexpected url: ${url}`);
  };
  return { fetcher, calls };
}

beforeEach(() => {
  process.env.YOUTUBE_API_KEY = 'test-key';
});
afterEach(() => {
  delete process.env.YOUTUBE_API_KEY;
});

describe('loadVideosWith（fetcher注入・オーケストレーション）', () => {
  it('最新動画・再生リスト・ライブ状態をまとめて返す', async () => {
    const { fetcher } = makeFetcher();
    const data = await loadVideosWith(fetcher);

    expect(data.latest.map((v) => v.id)).toEqual(['vid_new', 'vid_song']);
    expect(data.playlists.map((p) => p.id)).toEqual(['PL_game', 'PL_song']);
    expect(data.live.isLive).toBe(true);
    expect(data.live.liveVideo?.id).toBe('vid_live');
  });

  it('APIキーが無ければ例外（中核失敗＝ビルド失敗, §4）', async () => {
    delete process.env.YOUTUBE_API_KEY;
    const { fetcher } = makeFetcher();
    await expect(loadVideosWith(fetcher)).rejects.toThrow(/YOUTUBE_API_KEY/);
  });

  it('中核データ（channels）取得失敗は例外として伝播する', async () => {
    const { fetcher } = makeFetcher({ throwOn: (u) => u.includes('/channels') });
    await expect(loadVideosWith(fetcher)).rejects.toThrow(/boom/);
  });

  it('一部の再生リスト取得失敗は握りつぶし、成功分だけ返す（副次データ, §21）', async () => {
    // PL_song の playlistItems だけ失敗させる
    const { fetcher } = makeFetcher({ throwOn: (u) => u.includes('playlistId=PL_song') });
    const data = await loadVideosWith(fetcher);
    expect(data.playlists.map((p) => p.id)).toEqual(['PL_game']);
    expect(data.latest.length).toBeGreaterThan(0); // 中核は無事
  });

  it('ライブ判定の取得失敗では落とさず、非ライブ扱いで継続する', async () => {
    const { fetcher } = makeFetcher({ throwOn: (u) => u.includes('/videos') });
    const data = await loadVideosWith(fetcher);
    expect(data.live).toEqual({ isLive: false, liveVideo: null });
    expect(data.latest.length).toBeGreaterThan(0);
  });

  it('おすすめ固定動画は指定IDを設定順に並べ直して返す（APIが順不同でも）', async () => {
    expect(featuredVideoIds.length).toBeGreaterThan(0); // 固定運用が前提のテスト
    // APIはわざと逆順で返す → loaderが featuredVideoIds の順へ並べ直すことを検証
    const scrambled = [...featuredVideoIds].reverse();
    const fetcher = async (url: string): Promise<unknown> => {
      const u = new URL(url);
      const path = u.pathname;
      const id = u.searchParams.get('id') ?? '';
      if (path.endsWith('/channels')) return fx('youtube-channels.json');
      if (path.endsWith('/playlists')) return fx('youtube-playlists.json');
      if (path.endsWith('/playlistItems')) return fx('youtube-playlist-items.json');
      if (path.endsWith('/videos')) {
        if (id.includes(featuredVideoIds[0]!)) {
          return { items: scrambled.map((vid) => ({ id: vid, snippet: { title: `pinned-${vid}` } })) };
        }
        return fx('youtube-videos-live.json'); // ライブ判定用
      }
      throw new Error(`unexpected url: ${url}`);
    };
    const data = await loadVideosWith(fetcher);
    expect(data.featured.map((v) => v.id)).toEqual(featuredVideoIds);
  });

  it('固定動画の取得失敗時は最新上位3本にフォールバックする', async () => {
    const fetcher = async (url: string): Promise<unknown> => {
      const u = new URL(url);
      const path = u.pathname;
      const id = u.searchParams.get('id') ?? '';
      if (path.endsWith('/channels')) return fx('youtube-channels.json');
      if (path.endsWith('/playlists')) return fx('youtube-playlists.json');
      if (path.endsWith('/playlistItems')) return fx('youtube-playlist-items.json');
      if (path.endsWith('/videos')) {
        if (id.includes(featuredVideoIds[0]!)) throw new Error('boom: featured');
        return fx('youtube-videos-live.json');
      }
      throw new Error(`unexpected url: ${url}`);
    };
    const data = await loadVideosWith(fetcher);
    expect(data.featured).toEqual(data.latest.slice(0, 3));
  });
});
