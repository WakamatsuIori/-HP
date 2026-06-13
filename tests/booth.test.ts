import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBoothFeed } from '../src/lib/booth';

const rss = readFileSync(join(__dirname, 'fixtures', 'sample-booth.rss'), 'utf-8');

describe('parseBoothFeed', () => {
  const goods = parseBoothFeed(rss);

  it('linkもguidも無い項目は除外する', () => {
    expect(goods).toHaveLength(3);
    expect(goods.find((g) => g.title.includes('リンク欠落'))).toBeUndefined();
  });

  it('description内の<img>からサムネイルを取得し、本文から価格(¥1,200)を拾う', () => {
    const g = goods[0]!;
    expect(g.url).toBe('https://sample-shop.booth.pm/items/1000001');
    expect(g.imageUrl).toBe('https://booth.pximg.net/c/300x300/sample1.jpg');
    expect(g.price).toBe('¥1,200');
  });

  it('enclosureからサムネイル、タイトルから価格(￥500)を取得する', () => {
    const g = goods[1]!;
    expect(g.imageUrl).toBe('https://booth.pximg.net/c/300x300/sample2.jpg');
    expect(g.price).toBe('￥500');
  });

  it('media:thumbnailからサムネイルを取得し、価格が無ければ未設定', () => {
    const g = goods[2]!;
    expect(g.imageUrl).toBe('https://booth.pximg.net/c/300x300/sample3.jpg');
    expect(g.price).toBeUndefined();
  });

  it('pubDateを日付として読み取る（+0900 → UTC）', () => {
    expect(goods[0]!.publishedAt?.toISOString()).toBe('2026-06-09T03:00:00.000Z');
  });

  it('タイトルのHTML/CDATAは安全なテキストに正規化する（タグを残さない）', () => {
    const xml =
      '<rss><channel><item><title><![CDATA[<b>太字</b> &amp; <script>x</script>]]></title>' +
      '<link>https://s.booth.pm/items/9</link></item></channel></rss>';
    const g = parseBoothFeed(xml)[0]!;
    expect(g.title).not.toContain('<');
    expect(g.title).toContain('太字');
    expect(g.title).toContain('&'); // &amp; は & に復元される
  });

  it('itemが無い／壊れた入力でも例外を投げず空配列を返す', () => {
    expect(parseBoothFeed('<rss><channel></channel></rss>')).toEqual([]);
    expect(parseBoothFeed('not xml at all')).toEqual([]);
    expect(parseBoothFeed('')).toEqual([]);
  });
});
