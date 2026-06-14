/**
 * Discordスラッシュコマンド `/予定` の受け口（Cloudflare Pages Function）。
 * 公開URL: https://<サイト>/discord/interactions
 *
 * 流れ：署名検証 → コマンド解析 → （3秒制限を避けるため）いったん「考え中」を返し、
 * 裏でGoogleカレンダーへ1件追加 → 結果を本人だけに見える形で返信。
 * カレンダーに入った予定は、既存の .ics→ビルド経路でHPの週間ボードに自動反映される。
 */
import {
  verifyDiscordSignature,
  InteractionType,
  InteractionResponseType,
  EPHEMERAL,
  json,
} from '../_lib/discord';
import { getAccessToken, insertEvent } from '../_lib/google';
import { buildWhen, type ParsedWhen } from '../_lib/datetime';

interface Env {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APP_ID: string;
  /** 実行を許可するDiscordユーザーID（カンマ区切り）。空なら誰でも可＝非推奨 */
  DISCORD_ALLOWED_USER_IDS?: string;
  GOOGLE_SA_EMAIL: string;
  GOOGLE_SA_PRIVATE_KEY: string;
  GOOGLE_CALENDAR_ID: string;
  /** /ポスター 用：GitHub Actions を起動するためのトークンと対象リポジトリ（owner/repo） */
  GITHUB_DISPATCH_TOKEN?: string;
  GITHUB_REPO?: string;
  /** 任意：1日の書き込み上限ガード用（KVをバインドしたときだけ有効） */
  SCHED_KV?: { get(k: string): Promise<string | null>; put(k: string, v: string, o?: { expirationTtl?: number }): Promise<void> };
}

// おすすめ枠の目印。src/lib/weekly.ts の FEATURED_MARK と必ず一致させること。
const FEATURED_MARK = '#おすすめ';
// 1日の書き込み上限（KVバインド時のみ有効）。CLAUDE.md §3 の書き込みガード。
const DAILY_WRITE_CAP = 30;

function optMap(options: Array<{ name: string; value: unknown }> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const o of options ?? []) out[o.name] = o.value;
  return out;
}

function reply(content: string) {
  return json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { flags: EPHEMERAL, content },
  });
}

export async function onRequestPost(ctx: {
  request: Request;
  env: Env;
  waitUntil(p: Promise<unknown>): void;
}): Promise<Response> {
  const { request, env } = ctx;
  const sig = request.headers.get('x-signature-ed25519') ?? '';
  const ts = request.headers.get('x-signature-timestamp') ?? '';
  const raw = await request.text();

  // 署名検証（Discordの必須要件）。失敗は401で返す。
  if (!sig || !ts || !(await verifyDiscordSignature(env.DISCORD_PUBLIC_KEY, sig, ts, raw))) {
    return new Response('invalid request signature', { status: 401 });
  }

  const body = JSON.parse(raw);

  // 疎通確認（Discordの登録時とヘルスチェック）
  if (body.type === InteractionType.PING) {
    return json({ type: InteractionResponseType.PONG });
  }

  if (body.type === InteractionType.APPLICATION_COMMAND) {
    // 実行できる人を本人のDiscordユーザーIDに限定（書き込みの第一ガード）
    const userId = body.member?.user?.id ?? body.user?.id;
    const allow = (env.DISCORD_ALLOWED_USER_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (allow.length && !allow.includes(userId)) {
      return reply('⚠️ このコマンドを使う権限がありません。');
    }

    if (body.data?.name === '予定') {
      const opts = optMap(body.data.options);
      const dateStr = String(opts['日付'] ?? '');
      const timeStr = opts['時間'] != null ? String(opts['時間']) : '';
      const title = String(opts['タイトル'] ?? '').trim();
      const featured = Boolean(opts['おすすめ']);

      if (!title) return reply('⚠️ タイトルを入力してください。');
      const when = buildWhen(dateStr, timeStr, new Date());
      if ('error' in when) return reply(`⚠️ ${when.error}`);

      // 3秒以内に確実に応答するため「考え中」を返し、登録は裏で行う。
      ctx.waitUntil(handleSchedule(env, body, when, title, featured));
      return json({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, data: { flags: EPHEMERAL } });
    }

    if (body.data?.name === '予定表') {
      const opts = optMap(body.data.options);
      const week = opts['週'] === '来週' ? '来週' : '今週';
      ctx.waitUntil(handlePoster(env, body, week));
      return json({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, data: { flags: EPHEMERAL } });
    }

    return reply('不明なコマンドです。');
  }

  return json({ type: InteractionResponseType.PONG });
}

/** カレンダーへ1件追加し、結果をDiscordの元メッセージに反映する（deferredの後追い編集） */
async function handleSchedule(
  env: Env,
  interaction: { token: string },
  when: ParsedWhen,
  title: string,
  featured: boolean,
): Promise<void> {
  const followup = `https://discord.com/api/v10/webhooks/${env.DISCORD_APP_ID}/${interaction.token}/messages/@original`;
  const edit = (content: string) =>
    fetch(followup, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) });

  try {
    // 1日の書き込み上限ガード（KVがバインドされているときだけ）
    if (env.SCHED_KV) {
      const key = `wcount:${new Date().toISOString().slice(0, 10)}`;
      const cur = Number((await env.SCHED_KV.get(key)) ?? '0');
      if (cur >= DAILY_WRITE_CAP) {
        await edit(`⚠️ 本日の登録上限（${DAILY_WRITE_CAP}件）に達しました。明日また試してください。`);
        return;
      }
      await env.SCHED_KV.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 36 });
    }

    const token = await getAccessToken(
      { clientEmail: env.GOOGLE_SA_EMAIL, privateKey: env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n') },
      Math.floor(Date.now() / 1000),
    );
    await insertEvent(token, env.GOOGLE_CALENDAR_ID, {
      summary: title,
      description: featured ? FEATURED_MARK : undefined,
      startDateTime: when.startDateTime,
      endDateTime: when.endDateTime,
      startDate: when.startDate,
      endDate: when.endDate,
    });

    const star = featured ? '（◆おすすめ）' : '';
    const kind = when.startDateTime ? '配信予定' : '休業';
    await edit(`✅ ${kind}を登録しました：\n**${when.label}　${title}**${star}\nHPの週間ボードには次回更新（最大15分）で反映されます。`);
  } catch (e) {
    await edit(`⚠️ 登録に失敗しました：${e instanceof Error ? e.message : String(e)}`);
  }
}

/** /ポスター：GitHub Actions(repository_dispatch)を起動して画像生成を依頼する */
async function handlePoster(env: Env, interaction: { token: string }, week: string): Promise<void> {
  const followup = `https://discord.com/api/v10/webhooks/${env.DISCORD_APP_ID}/${interaction.token}/messages/@original`;
  const edit = (content: string) =>
    fetch(followup, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) });

  if (!env.GITHUB_DISPATCH_TOKEN || !env.GITHUB_REPO) {
    await edit('⚠️ ポスター生成の設定（GitHubトークン）が未完了です。手順書 08 を確認してください。');
    return;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
        accept: 'application/vnd.github+json',
        'user-agent': 'wakamatsu-hp-bot',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'make-poster', client_payload: { week } }),
    });
    if (!res.ok) {
      await edit(`⚠️ 生成の起動に失敗しました：${res.status} ${await res.text()}`);
      return;
    }
    await edit(`🛠️ ${week}のポスター生成を開始しました。1〜2分でこのサーバーに画像が投稿されます。`);
  } catch (e) {
    await edit(`⚠️ 生成の起動に失敗しました：${e instanceof Error ? e.message : String(e)}`);
  }
}
