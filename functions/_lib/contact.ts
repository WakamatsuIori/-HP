/**
 * 独自お問い合わせフォームの純ロジック（副作用なし・テスト可能）。
 * 外部ネットワーク（Turnstile検証・Discord送信・Sheets追記）は functions/contact/submit.ts 側。
 * 外部入力は「信頼しないデータ」として扱い、検証と無害化をここで行う（CLAUDE.md §3）。
 */

/** ご用件の選択肢（フォームの select と一致させる） */
export const CONTACT_SUBJECTS = ['コラボのご相談', '企業案件・PR', '取材・出演', 'その他'] as const;

const MAX = { name: 100, email: 200, subject: 40, message: 4000 };

export interface ContactInput {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  /** ハニーポット（人間は空のはず。ボットが埋めがち） */
  website?: unknown;
}

export interface ValidatedContact {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type ContactValidation =
  | { ok: true; value: ValidatedContact }
  | { ok: false; reason: 'honeypot' | 'invalid'; message: string };

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** メールの最低限の形式チェック（厳密さより誤検知の少なさを優先） */
export function looksLikeEmail(v: string): boolean {
  return v.length <= MAX.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** 入力の検証＋ハニーポット判定。通過時のみ trim 済みの値を返す。 */
export function validateContact(input: ContactInput): ContactValidation {
  // ハニーポット：隠しフィールドに何か入っていればボット。静かに弾く。
  if (str(input.website)) return { ok: false, reason: 'honeypot', message: 'ok' };

  const name = str(input.name);
  const email = str(input.email);
  const subject = str(input.subject);
  const message = str(input.message);

  if (!name || name.length > MAX.name) return { ok: false, reason: 'invalid', message: 'お名前をご確認ください。' };
  if (!looksLikeEmail(email)) return { ok: false, reason: 'invalid', message: 'メールアドレスの形式をご確認ください。' };
  if (!(CONTACT_SUBJECTS as readonly string[]).includes(subject))
    return { ok: false, reason: 'invalid', message: 'ご用件をお選びください。' };
  if (!message || message.length > MAX.message)
    return { ok: false, reason: 'invalid', message: '内容をご確認ください（4000文字まで）。' };

  return { ok: true, value: { name, email, subject, message } };
}

/**
 * Discord のプレーンテキスト向け無害化：メンション無効化・コードブロック脱出防止・長さ制限。
 * （webhook 側でも allowed_mentions を空にするが、二重で防ぐ）
 */
export function sanitizeForDiscord(v: string, max = 1000): string {
  let out = v.replace(/@(everyone|here)/gi, '@​$1'); // @everyone/@here を無効化
  out = out.replace(/```/g, '`​``'); // ``` を割ってコードブロック脱出を防ぐ
  if (out.length > max) out = out.slice(0, max) + '…';
  return out;
}

/** Discord webhook の本文（プレーンテキスト）。値は sanitize 済みで組む。 */
export function buildDiscordMessage(c: ValidatedContact, isoTime: string): string {
  return [
    '**📩 新しいお問い合わせ**',
    `**用件**：${sanitizeForDiscord(c.subject, 60)}`,
    `**お名前**：${sanitizeForDiscord(c.name, 120)}`,
    `**メール**：${sanitizeForDiscord(c.email, 200)}`,
    `**内容**：\n${sanitizeForDiscord(c.message, 1500)}`,
    `_受信: ${isoTime}_`,
  ].join('\n');
}

/** スプレッドシート追記用の1行（列順：日時 / 用件 / 名前 / メール / 内容）。 */
export function buildSheetRow(c: ValidatedContact, isoTime: string): string[] {
  return [isoTime, c.subject, c.name, c.email, c.message];
}
