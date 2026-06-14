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
import { getAccessToken, insertEvent, listEvents, deleteEvent } from '../_lib/google';
import { buildWhen, dayRange, type ParsedWhen } from '../_lib/datetime';
import { FEATURED_MARK } from '../../src/lib/featured';

interface Env {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APP_ID: string;
  /** 実行を許可するDiscordユーザーID（カンマ区切り）。未設定/空なら全員拒否（fail-closed）。オーナー自身のIDを入れる。 */
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

// 1日の書き込み上限（KVバインド時のみ有効）。CLAUDE.md §3 の書き込みガード。
const DAILY_WRITE_CAP = 30;

/** 受け取る Discord interaction の最小型（必要なフィールドだけ・依存追加なし） */
interface InteractionOption {
  name: string;
  value?: unknown;
}
interface DiscordInteraction {
  type: number;
  token: string;
  data?: { name?: string; options?: InteractionOption[] };
  member?: { user?: { id?: string } };
  user?: { id?: string };
}

function optMap(options: InteractionOption[] | undefined): Record<string, unknown> {
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

/** deferred応答の後追い編集（元メッセージをPATCH）を行う関数を作る。3コマンドで共通。 */
function makeEditor(env: Env, interactionToken: string): (content: string) => Promise<Response> {
  const url = `https://discord.com/api/v10/webhooks/${env.DISCORD_APP_ID}/${interactionToken}/messages/@original`;
  return (content: string) =>
    fetch(url, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) });
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

  const body = JSON.parse(raw) as DiscordInteraction;

  // 疎通確認（Discordの登録時とヘルスチェック）
  if (body.type === InteractionType.PING) {
    return json({ type: InteractionResponseType.PONG });
  }

  if (body.type === InteractionType.APPLICATION_COMMAND) {
    // コマンド本体が無いペイロードは不正として弾く（想定外の入力への防御）
    if (!body.data?.name) return reply('不明なコマンドです。');

    // 実行できる人をオーナー本人のDiscordユーザーIDに限定（書き込みの第一ガード）。
    // 許可リストが未設定/空なら全員拒否（fail-closed）。事故防止のため明示的に許可した人だけ通す。
    const userId = body.member?.user?.id ?? body.user?.id;
    const allow = (env.DISCORD_ALLOWED_USER_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!allow.length || !userId || !allow.includes(userId)) {
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

    if (body.data?.name === '予定消去') {
      const opts = optMap(body.data.options);
      const range = dayRange(String(opts['日付'] ?? ''), new Date());
      if ('error' in range) return reply(`⚠️ ${range.error}`);
      ctx.waitUntil(handleDelete(env, body, range));
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
  const edit = makeEditor(env, interaction.token);

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
    console.error('[/予定] 登録に失敗', e);
    await edit(`⚠️ 登録に失敗しました：${e instanceof Error ? e.message : String(e)}`);
  }
}

/** /予定消去：指定日のその日の予定をすべて削除する */
async function handleDelete(
  env: Env,
  interaction: { token: string },
  range: { timeMin: string; timeMax: string; label: string },
): Promise<void> {
  const edit = makeEditor(env, interaction.token);

  try {
    const token = await getAccessToken(
      { clientEmail: env.GOOGLE_SA_EMAIL, privateKey: env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n') },
      Math.floor(Date.now() / 1000),
    );
    const items = await listEvents(token, env.GOOGLE_CALENDAR_ID, range.timeMin, range.timeMax);
    if (items.length === 0) {
      await edit(`ℹ️ ${range.label} に消す予定はありませんでした。`);
      return;
    }
    const titles: string[] = [];
    for (const it of items) {
      await deleteEvent(token, env.GOOGLE_CALENDAR_ID, it.id);
      titles.push(it.summary ?? '(無題)');
    }
    await edit(
      `🗑️ ${range.label} の予定を${titles.length}件削除しました：\n${titles.map((t) => `・${t}`).join('\n')}\nHPの週間ボードには次回更新（最大15分）で反映されます。`,
    );
  } catch (e) {
    console.error('[/予定消去] 削除に失敗', e);
    await edit(`⚠️ 削除に失敗しました：${e instanceof Error ? e.message : String(e)}`);
  }
}

/** /予定表：GitHub Actions(repository_dispatch)を起動して画像生成を依頼する */
async function handlePoster(env: Env, interaction: { token: string }, week: string): Promise<void> {
  const edit = makeEditor(env, interaction.token);

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
    console.error('[/予定表] 生成の起動に失敗', e);
    await edit(`⚠️ 生成の起動に失敗しました：${e instanceof Error ? e.message : String(e)}`);
  }
}
