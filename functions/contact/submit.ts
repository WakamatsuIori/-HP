/**
 * 独自お問い合わせフォームの受け口（Cloudflare Pages Function・POST /contact/submit）。
 * ・同一オリジンのPOSTのみ受け付ける（CSRFの初手）。
 * ・ハニーポット → Turnstile検証 → 入力検証 の順で弾く。
 * ・通過分は Discord webhook へ通知＋専用 Google スプレッドシートへ1行追記。
 * ・秘密情報は全て Pages 環境変数（CLAUDE.md §3）。外部入力は信頼せず無害化する。
 */
import {
  validateContact,
  buildDiscordMessage,
  buildSheetRow,
  type ContactInput,
} from '../_lib/contact';
import { getAccessToken, appendSheetRow } from '../_lib/google';

interface Env {
  CONTACT_WEBHOOK_URL?: string; // Discord webhook（専用チャンネル）
  CONTACT_SHEET_ID?: string; // 記録先スプレッドシートID
  TURNSTILE_SECRET_KEY?: string; // Cloudflare Turnstile シークレット
  GOOGLE_SA_EMAIL?: string; // サービスアカウント（Calendarと共用）
  GOOGLE_SA_PRIVATE_KEY?: string;
}
interface Ctx {
  request: Request;
  env: Env;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/** Turnstile のトークンを検証（ボットでないことの確認） */
async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  try {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const d = (await r.json()) as { success?: boolean };
    return d.success === true;
  } catch {
    return false;
  }
}

export async function onRequestPost(ctx: Ctx): Promise<Response> {
  const { request, env } = ctx;

  // 同一オリジンのPOSTのみ（他サイトからの投稿を拒否）
  const origin = request.headers.get('origin');
  const host = new URL(request.url).host;
  if (origin && new URL(origin).host !== host) {
    return json({ ok: false, message: '不正なリクエストです。' }, 403);
  }

  // 入力取得（FormData / JSON 両対応）
  let raw: Record<string, string> = {};
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const obj = (await request.json()) as Record<string, unknown>;
      for (const [k, v] of Object.entries(obj)) raw[k] = typeof v === 'string' ? v : '';
    } else {
      const fd = await request.formData();
      for (const [k, v] of fd.entries()) raw[k] = typeof v === 'string' ? v : '';
    }
  } catch {
    return json({ ok: false, message: '送信データを読めませんでした。' }, 400);
  }

  // 検証＋ハニーポット（website が埋まっていれば静かに成功偽装で捨てる）
  const input: ContactInput = {
    name: raw.name,
    email: raw.email,
    subject: raw.subject,
    message: raw.message,
    website: raw.website,
  };
  const v = validateContact(input);
  if (!v.ok) {
    if (v.reason === 'honeypot') return json({ ok: true }); // ボットに気付かせない
    return json({ ok: false, message: v.message }, 400);
  }

  // Turnstile 検証（設定されている時だけ実施）。未設定ならスキップ＝ハニーポット＋Origin＋入力検証で受理。
  // 後日 TURNSTILE_SECRET_KEY を入れれば自動で有効化される（スパムが増えたら追加する想定）。
  if (env.TURNSTILE_SECRET_KEY) {
    const token = raw['cf-turnstile-response'] || '';
    const ip = request.headers.get('cf-connecting-ip');
    if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip))) {
      return json({ ok: false, message: '確認に失敗しました。ページを再読み込みしてお試しください。' }, 400);
    }
  }

  const isoTime = new Date().toISOString();

  // スパム対策の砦は Turnstile＋ハニーポット＋Origin。将来、連投がひどければ
  // KV による IP/日次のレート上限（interactions.ts の SCHED_KV 方式）を足す余地あり（現状は未実装）。
  // 届け先（両方あれば両方へ。少なくとも1つ成功すれば受理＝取りこぼしを避ける）
  const tasks: Promise<boolean>[] = [];

  if (env.CONTACT_WEBHOOK_URL) {
    tasks.push(
      fetch(env.CONTACT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: buildDiscordMessage(v.value, isoTime),
          allowed_mentions: { parse: [] }, // @everyone/@here 等を無効化
        }),
      })
        .then((r) => {
          if (!r.ok) console.warn('[contact] Discord webhook 応答異常:', r.status);
          return r.ok;
        })
        .catch((e) => {
          console.error('[contact] Discord送信に失敗:', e instanceof Error ? e.message : e);
          return false;
        }),
    );
  }

  if (env.CONTACT_SHEET_ID && env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_PRIVATE_KEY) {
    tasks.push(
      (async () => {
        try {
          const at = await getAccessToken(
            // 秘密鍵は1行env(\nエスケープ)で保存されるため実改行へ戻す（既存Calendar連携と同じ作法）
            { clientEmail: env.GOOGLE_SA_EMAIL!, privateKey: env.GOOGLE_SA_PRIVATE_KEY!.replace(/\\n/g, '\n') },
            Math.floor(Date.now() / 1000),
            'https://www.googleapis.com/auth/spreadsheets',
          );
          await appendSheetRow(at, env.CONTACT_SHEET_ID!, 'A1', buildSheetRow(v.value, isoTime));
          return true;
        } catch (e) {
          console.error('[contact] スプレッドシート追記に失敗:', e instanceof Error ? e.message : e);
          return false;
        }
      })(),
    );
  }

  // 届け先が1つも設定されていなければ受理しない（管理者に届かないため）
  if (tasks.length === 0) return json({ ok: false, message: 'フォームは設定準備中です。' }, 503);

  const results = await Promise.all(tasks);
  if (!results.some(Boolean)) {
    return json({ ok: false, message: '送信に失敗しました。時間をおいてお試しください。' }, 502);
  }

  return json({ ok: true });
}
