import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadLiveStatusWith, resolveLiveStatus } from '../src/lib/live';

function fx(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, 'fixtures', name), 'utf-8'));
}

/**
 * YouTube APIのモック。パスごとにfixtureを返す。
 * channels / playlistItems は既存fixtureを再利用、videos は差し替え可能（ライブ/非ライブ切替）。
 */
function makeFetcher(opts: { videos?: unknown; channels?: unknown; throwOn?: (url: string) => boolean } = {}) {
  const calls: string[] = [];
  const fetcher = async (url: string): Promise<unknown> => {
    calls.push(url);
    if (opts.throwOn?.(url)) throw new Error(`boom: ${url}`);
    const path = new URL(url).pathname;
    if (path.endsWith('/channels')) return opts.channels ?? fx('youtube-channels.json');
    if (path.endsWith('/playlistItems')) return fx('youtube-playlist-items.json');
    if (path.endsWith('/videos')) return opts.videos ?? fx('youtube-videos-live.json');
    throw new Error(`unexpected url: ${url}`);
  };
  return { fetcher, calls };
}

describe('loadLiveStatusWith（訪問時ライブ判定・fetcher注入）', () => {
  it('ライブ中なら isLive=true と枠情報を返す。叩くのは3回だけ（search.list不使用）', async () => {
    const { fetcher, calls } = makeFetcher();
    const live = await loadLiveStatusWith(fetcher, 'test-key', 'UC_test');
    expect(live.isLive).toBe(true);
    expect(live.liveVideo?.id).toBe('vid_live');
    expect(calls).toHaveLength(3); // channels / playlistItems / videos
    expect(calls.some((u) => u.includes('/search'))).toBe(false);
  });

  it('ライブでなければ isLive=false', async () => {
    const notLive = { items: [{ id: 'vid_x', snippet: { title: '通常動画', liveBroadcastContent: 'none' } }] };
    const { fetcher } = makeFetcher({ videos: notLive });
    const live = await loadLiveStatusWith(fetcher, 'test-key', 'UC_test');
    expect(live).toEqual({ isLive: false, liveVideo: null });
  });

  it('uploadsプレイリストが取れなければ非ライブで、videos.listは叩かない', async () => {
    const { fetcher, calls } = makeFetcher({ channels: { items: [] } });
    const live = await loadLiveStatusWith(fetcher, 'test-key', 'UC_test');
    expect(live).toEqual({ isLive: false, liveVideo: null });
    expect(calls.some((u) => u.includes('/videos'))).toBe(false);
  });

  it('取得失敗は例外として投げる（受け口側で握りつぶす前提）', async () => {
    const { fetcher } = makeFetcher({ throwOn: (u) => u.includes('/channels') });
    await expect(loadLiveStatusWith(fetcher, 'test-key', 'UC_test')).rejects.toThrow(/boom/);
  });
});

describe('resolveLiveStatus（受け口のフォールバック・§4）', () => {
  it('キー未設定なら非ライブ＋短TTL（YouTubeを一切叩かない）', async () => {
    const { fetcher, calls } = makeFetcher();
    const r = await resolveLiveStatus(fetcher, undefined, 'UC_test');
    expect(r.live).toEqual({ isLive: false, liveVideo: null });
    expect(r.ttlSeconds).toBe(30);
    expect(calls).toHaveLength(0);
  });

  it('チャンネルID未設定でも非ライブ＋短TTL', async () => {
    const { fetcher } = makeFetcher();
    const r = await resolveLiveStatus(fetcher, 'test-key', undefined);
    expect(r.live.isLive).toBe(false);
    expect(r.ttlSeconds).toBe(30);
  });

  it('成功時はライブ状態＋120秒TTL', async () => {
    const { fetcher } = makeFetcher();
    const r = await resolveLiveStatus(fetcher, 'test-key', 'UC_test');
    expect(r.live.isLive).toBe(true);
    expect(r.live.liveVideo?.id).toBe('vid_live');
    expect(r.ttlSeconds).toBe(120);
  });

  it('取得失敗でも例外を投げず非ライブ＋短TTLで返す（バッジを壊さない）', async () => {
    const { fetcher } = makeFetcher({ throwOn: (u) => u.includes('/channels') });
    const r = await resolveLiveStatus(fetcher, 'test-key', 'UC_test');
    expect(r.live).toEqual({ isLive: false, liveVideo: null });
    expect(r.ttlSeconds).toBe(30);
  });
});
