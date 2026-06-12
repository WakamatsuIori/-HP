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
