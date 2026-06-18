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
