import { describe, expect, it } from 'vitest';
import { livePages, livePageImage, youtubeVideoId } from '../src/config/live-pages';

describe('youtubeVideoId', () => {
  it('youtu.be 短縮URLからIDを取る', () => {
    expect(youtubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('watch?v= 形式からIDを取る', () => {
    expect(youtubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('watch?feature=...&v= のように v が後ろでも取れる', () => {
    expect(youtubeVideoId('https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });
  it('live/ 形式（配信待機所）からIDを取る', () => {
    expect(youtubeVideoId('https://www.youtube.com/live/dQw4w9WgXcQ?feature=share')).toBe(
      'dQw4w9WgXcQ',
    );
  });
  it('チャンネルURLなどIDが無いものは null', () => {
    expect(youtubeVideoId('https://www.youtube.com/@Wakamatsu-Iori/streams')).toBeNull();
  });
});

describe('livePageImage', () => {
  it('image 指定が最優先', () => {
    expect(
      livePageImage({ image: '/info/banner.png', youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ' }),
    ).toBe('/info/banner.png');
  });
  it('image が無ければ YouTube サムネ', () => {
    expect(livePageImage({ youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ' })).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    );
  });
  it('IDが取れなければ共通 /og.jpg', () => {
    expect(livePageImage({ youtubeUrl: 'https://www.youtube.com/@Wakamatsu-Iori' })).toBe(
      '/og.jpg',
    );
  });
});

describe('livePages データ', () => {
  it('slug は YYYY-MM-DD-英単語 形式（URLキャッシュ回避の決まり）', () => {
    for (const p of livePages) {
      expect(p.slug).toMatch(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/);
    }
  });
  it('slug に重複が無い', () => {
    const slugs = livePages.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
