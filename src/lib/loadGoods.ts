/**
 * ビルド時にBOOTHのRSSフィードからグッズ一覧を読み込む入口。
 *
 * フォールバック方針（CLAUDE.md §4 を補助ソース向けに運用）:
 * - 設定漏れ（URL未設定）はビルドを止める（開発者が気づけるように）。
 * - フィード取得・解析の失敗（BOOTHはサーバーからの自動取得を 406 等で拒否することがある）は
 *   ビルドを止めず available=false を返し、ページ側でフォールバック表示（BOOTHへのリンク）にする。
 *   グッズは補助表示であり、ここで全体ビルドを落とすとスケジュール・動画の更新まで巻き添えになるため。
 * - 取得成功・商品0件は available=true / goods=[]（表示側で「準備中」）。
 */
import { fetchTextAsBrowser, type TextFetcher } from './fetcher';
import { parseBoothFeed, type Goods } from './booth';
import { site } from '../config/site';

/** 表示するグッズの最大件数（ページを重くしない／暴走防止） */
export const MAX_GOODS = 12;

function boothFeedUrl(): string {
  const url = site.sources.boothFeedUrl;
  if (!url) {
    throw new Error(
      'BOOTHフィードURLが設定されていません。src/config/site.ts の sources.boothFeedUrl を設定してください（手順: docs/setup/06-booth-feed.md）',
    );
  }
  return url;
}

/** テストや再利用のための本体（fetcherを差し替え可能） */
export async function loadGoodsWith(fetcher: TextFetcher): Promise<Goods[]> {
  const xml = await fetcher(boothFeedUrl());
  return parseBoothFeed(xml).slice(0, MAX_GOODS);
}

export interface GoodsResult {
  /** 取得できたグッズ（最大 MAX_GOODS 件） */
  goods: Goods[];
  /** BOOTHフィードを取得・解析できたか（false のときページはフォールバック表示にする） */
  available: boolean;
}

// 複数ページから呼ばれても取得は1回だけにする。
// dev中もキャッシュする：BOOTHはアクセス制限があるため、リロードのたびに叩かない。
let cache: Promise<GoodsResult> | null = null;

export function loadGoods(): Promise<GoodsResult> {
  cache ??= (async (): Promise<GoodsResult> => {
    // 設定漏れはビルドを止めて気づけるように（フォールバックで隠さない）
    if (!site.sources.boothFeedUrl) {
      throw new Error(
        'BOOTHフィードURLが設定されていません。src/config/site.ts の sources.boothFeedUrl を設定してください（手順: docs/setup/06-booth-feed.md）',
      );
    }
    try {
      const goods = await loadGoodsWith(fetchTextAsBrowser);
      return { goods, available: true };
    } catch (e) {
      // BOOTHが自動取得を拒否（406等）した場合などはフォールバック表示にして、ビルドは続行する
      console.warn(
        '[goods] BOOTHフィードを取得できませんでした（フォールバック表示にします）:',
        e instanceof Error ? e.message : e,
      );
      return { goods: [], available: false };
    }
  })();
  return cache;
}
