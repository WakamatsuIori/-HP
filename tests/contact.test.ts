import { describe, it, expect } from 'vitest';
import {
  validateContact,
  looksLikeEmail,
  sanitizeForDiscord,
  buildDiscordMessage,
  buildSheetRow,
  CONTACT_SUBJECTS,
  type ValidatedContact,
} from '../functions/_lib/contact';

const valid = {
  name: '  和香松 庵 ',
  email: 'iori@example.com',
  subject: 'コラボのご相談',
  message: '  はじめまして。コラボのご相談です。 ',
};

describe('validateContact', () => {
  it('正しい入力は通過し、値は trim される', () => {
    const r = validateContact(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe('和香松 庵');
      expect(r.value.message).toBe('はじめまして。コラボのご相談です。');
      expect(r.value.subject).toBe('コラボのご相談');
    }
  });

  it('ハニーポット(website)が埋まっていれば honeypot として弾く', () => {
    const r = validateContact({ ...valid, website: 'http://spam.example' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('honeypot');
  });

  it('名前が空なら invalid', () => {
    const r = validateContact({ ...valid, name: '   ' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid');
  });

  it('メール形式が不正なら invalid', () => {
    const r = validateContact({ ...valid, email: 'not-an-email' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid');
  });

  it('用件が選択肢外なら invalid', () => {
    const r = validateContact({ ...valid, subject: '知らない用件' });
    expect(r.ok).toBe(false);
  });

  it('内容が空、または長すぎれば invalid', () => {
    expect(validateContact({ ...valid, message: '' }).ok).toBe(false);
    expect(validateContact({ ...valid, message: 'あ'.repeat(4001) }).ok).toBe(false);
  });

  it('文字列以外の入力(数値・null)は空扱いで invalid', () => {
    expect(validateContact({ ...valid, name: 123 }).ok).toBe(false);
    expect(validateContact({ ...valid, message: null }).ok).toBe(false);
  });

  it('全用件が選択肢として通る', () => {
    for (const s of CONTACT_SUBJECTS) {
      expect(validateContact({ ...valid, subject: s }).ok).toBe(true);
    }
  });
});

describe('looksLikeEmail', () => {
  it('妥当なメールは true', () => {
    expect(looksLikeEmail('a@b.co')).toBe(true);
  });
  it('@やドット無しは false', () => {
    expect(looksLikeEmail('abc')).toBe(false);
    expect(looksLikeEmail('a@b')).toBe(false);
    expect(looksLikeEmail('a b@c.d')).toBe(false);
  });
});

describe('sanitizeForDiscord', () => {
  it('@everyone / @here を無効化する（そのままの文字列は残さない）', () => {
    const out = sanitizeForDiscord('やあ @everyone @here');
    expect(out).not.toContain('@everyone');
    expect(out).not.toContain('@here');
  });
  it('コードブロック ``` を割ってエスケープする', () => {
    const out = sanitizeForDiscord('```js\nalert(1)```');
    expect(out.includes('```')).toBe(false);
  });
  it('最大長を超えると末尾を … で丸める', () => {
    const out = sanitizeForDiscord('あ'.repeat(50), 10);
    expect(out.length).toBeLessThanOrEqual(11);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('buildSheetRow / buildDiscordMessage', () => {
  const c: ValidatedContact = { name: '庵', email: 'i@e.com', subject: 'その他', message: 'テスト' };
  const iso = '2026-07-01T12:00:00.000Z';

  it('Sheet行は 日時/用件/名前/メール/内容 の順', () => {
    expect(buildSheetRow(c, iso)).toEqual([iso, 'その他', '庵', 'i@e.com', 'テスト']);
  });

  it('Discord本文に用件・名前・メール・内容・時刻が含まれる', () => {
    const msg = buildDiscordMessage(c, iso);
    expect(msg).toContain('その他');
    expect(msg).toContain('庵');
    expect(msg).toContain('i@e.com');
    expect(msg).toContain('テスト');
    expect(msg).toContain(iso);
  });
});
