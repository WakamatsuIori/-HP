/**
 * fetch層の分離。外部通信はすべてここを通す（テスト時はモックに差し替える）。
 */
export type TextFetcher = (url: string) => Promise<string>;

const TIMEOUT_MS = 15_000;

export const fetchText: TextFetcher = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`取得に失敗しました: HTTP ${res.status} (${url})`);
  }
  return res.text();
};

/**
 * ブラウザ相当のヘッダ付きでテキストを取得する。
 * 一部のフィード配信元（BOOTH等）は素のリクエストを拒否する（403/406）ため、
 * RSS取得にはこちらを使う。.ics取得（Google）は従来どおり fetchText を使う。
 */
export const fetchTextAsBrowser: TextFetcher = async (url) => {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5',
    },
  });
  if (!res.ok) {
    throw new Error(`取得に失敗しました: HTTP ${res.status} (${url})`);
  }
  return res.text();
};

/** JSON取得（YouTube Data API用）。fetch層に集約し、テスト時はモックに差し替える。 */
export type JsonFetcher = (url: string) => Promise<unknown>;

export const fetchJson: JsonFetcher = async (url) => {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    // URLにAPIキーが含まれるため、エラー文には絶対に出さない（key=... を伏せる。CLAUDE.md §3）
    const safeUrl = url.replace(/([?&]key=)[^&]+/i, '$1***');
    throw new Error(`取得に失敗しました: HTTP ${res.status} (${safeUrl})`);
  }
  return res.json();
};
