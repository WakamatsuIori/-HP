import { describe, it, expect } from 'vitest';
import { externalAttrs } from '../src/lib/links';

describe('externalAttrs', () => {
  it('外部URL(http/https)は別タブ＋relを付ける', () => {
    expect(externalAttrs('https://example.com')).toEqual({ rel: 'noopener', target: '_blank' });
    expect(externalAttrs('http://example.com')).toEqual({ rel: 'noopener', target: '_blank' });
  });
  it('内部リンクやページ内アンカーには何も付けない', () => {
    expect(externalAttrs('/news')).toEqual({});
    expect(externalAttrs('#top')).toEqual({});
  });
});
