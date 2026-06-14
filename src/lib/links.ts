/**
 * リンク先に応じた付加属性。外部リンク（http/https）だけ別タブ＋安全な rel を付ける。
 * 内部リンク（/path）やページ内アンカー（#id）には何も付けない。
 */
export function externalAttrs(url: string): { rel: 'noopener'; target: '_blank' } | Record<string, never> {
  return url.startsWith('http') ? { rel: 'noopener', target: '_blank' } : {};
}
