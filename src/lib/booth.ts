/**
 * BOOTHの商品フィード（RSS 2.0）を解析する純関数。通信・副作用なし。
 * フィード本文は「信頼しない外部入力」として扱い、タグ除去・エンティティ復元のうえ
 * 表示側（Astro）の自動エスケープに渡す（CLAUDE.md §3）。
 *
 * RSSは構造が単純なため、依存を足さず最小実装で解析する（CLAUDE.md §2 最小依存）。
 * 実フィードと項目構造がずれる場合に備え、画像・価格は複数の場所から拾う寛容な実装にしている。
 */

export interface Goods {
  /** 商品名 */
  title: string;
  /** BOOTH商品ページURL（購入はBOOTH側で行う） */
  url: string;
  /** サムネイル画像URL（取得できた場合のみ） */
  imageUrl?: string;
  /** 価格表記（例: "¥1,200"。フィードから読み取れた場合のみ） */
  price?: string;
  /** 公開日時（取得できた場合のみ） */
  publishedAt?: Date;
}

// --- 小さなヘルパ（tagRaw/tagAttr の name は本ファイル内の固定文字列のみ。
//     外部入力を渡さない前提なので RegExp インジェクションは起きない） ---

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => safeCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&'); // &amp; は最後に（二重復元を防ぐ）
}

function safeCodePoint(n: number): string {
  return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
}

/** タグを除去してテキスト化＋エンティティ復元＋空白整理 */
function toText(s: string): string {
  return decodeEntities(stripCdata(s).replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/** item内の最初の <name>...</name> の中身（生文字列）を返す */
function tagRaw(item: string, name: string): string | undefined {
  const m = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : undefined;
}

/** item内の <name ... attr="値" ...> から属性値を返す（自己終了/開始タグ両対応） */
function tagAttr(item: string, name: string, attr: string): string | undefined {
  const m = item.match(new RegExp(`<${name}\\b[^>]*\\b${attr}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? decodeEntities(m[1]!) : undefined;
}

/** description（HTML）内の最初の <img src="..."> を返す */
function firstImgSrc(html: string): string | undefined {
  const m = stripCdata(html).match(/<img\b[^>]*\bsrc\s*=\s*"([^"]+)"/i);
  return m ? decodeEntities(m[1]!) : undefined;
}

/** 「¥1,200」「￥1200」「1,200円」等を拾う（取れなければ undefined） */
function extractPrice(text: string): string | undefined {
  const m = text.match(/[¥￥]\s?\d[\d,]*|\d[\d,]*\s?円/);
  return m ? m[0].replace(/\s/g, '') : undefined;
}

function isHttpUrl(s: string | undefined): s is string {
  return !!s && /^https?:\/\//i.test(s);
}

const ITEM_RE = /<item\b[\s\S]*?<\/item>/gi;

export function parseBoothFeed(xml: string): Goods[] {
  const items = xml.match(ITEM_RE) ?? [];
  const goods: Goods[] = [];

  for (const item of items) {
    const linkRaw = tagRaw(item, 'link') ?? tagRaw(item, 'guid');
    const url = linkRaw ? decodeEntities(stripCdata(linkRaw).trim()) : '';
    if (!isHttpUrl(url)) continue; // リンクが無い／不正な項目は捨てる

    const title = toText(tagRaw(item, 'title') ?? '') || '(無題)';
    const descRaw = tagRaw(item, 'description') ?? '';

    const imageUrl =
      tagAttr(item, 'enclosure', 'url') ??
      tagAttr(item, 'media:thumbnail', 'url') ??
      tagAttr(item, 'media:content', 'url') ??
      firstImgSrc(descRaw);

    const price = extractPrice(title) ?? extractPrice(toText(descRaw));

    const pubRaw = tagRaw(item, 'pubDate');
    const pub = pubRaw ? new Date(stripCdata(pubRaw).trim()) : null;

    const g: Goods = { title, url };
    if (isHttpUrl(imageUrl)) g.imageUrl = imageUrl;
    if (price) g.price = price;
    if (pub && !Number.isNaN(pub.getTime())) g.publishedAt = pub;
    goods.push(g);
  }

  return goods;
}
