// 週間予定ポスター（Full HD 1920×1080 PNG）を生成し、任意でDiscordへ投稿する。
//
// 流れ: カレンダー(.ics)取得 → 対象週を計算 → ポスターHTMLに差し込み →
//        Chrome headless で撮影 → 1920×1080に整形 → Discord Webhookへ投稿。
//
// 環境変数:
//   ICS_URL                     … 配信予定カレンダーの .ics（HPと同じ）。必須。
//   DISCORD_POSTER_WEBHOOK_URL  … 出力先のDiscord Webhook（無ければ DISCORD_WEBHOOK_URL を使う。両方無ければ画像生成のみ）
//   POSTER_WEEK_OFFSET          … 0=今週 / 1=来週（既定1＝日曜自動は来週）
//   CHROME_BIN                  … Chrome実行パス（既定 'google-chrome'。CIのubuntuに同梱）
//
// 既存の ics.ts / weekly.ts をそのまま再利用する（Node 24 の型ストリッピングで .ts を直接import）。
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { parseIcsEvents } from '../src/lib/ics.ts';
import { buildWeek } from '../src/lib/weekly.ts';

const exec = promisify(execFile);

const ICS_URL = process.env.ICS_URL;
const WEBHOOK = process.env.DISCORD_POSTER_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
const WEEK_OFFSET = Number(process.env.POSTER_WEEK_OFFSET ?? '1');
const CHROME = process.env.CHROME_BIN || 'google-chrome';

if (!ICS_URL) {
  console.error('ICS_URL が未設定です。');
  process.exit(1);
}

// 1) カレンダー取得 → 対象週のデータ化（休業・おすすめも反映）
const icsText = await (await fetch(ICS_URL)).text();
const now = new Date();
const winStart = new Date(now.getTime() - 24 * 3600 * 1000);
const winEnd = new Date(now.getTime() + 21 * 24 * 3600 * 1000);
const events = parseIcsEvents(icsText, winStart, winEnd);
const week = buildWeek(events, now, WEEK_OFFSET);

// 2) テンプレHTMLに差し込み（WEEK と schedule をJSONで置換）
const tpl = await readFile(new URL('./poster/template.html', import.meta.url), 'utf8');
const scheduleData = week.days.map((d) => ({
  ja: d.ja,
  date: d.date,
  time: d.time,
  title: d.title,
  featured: !!d.featured,
}));
const injected = tpl
  .replace(/const WEEK = \{[^}]*\};/, `const WEEK = ${JSON.stringify({ month: week.month, range: week.range })};`)
  .replace(/const schedule = \[[\s\S]*?\];/, `const schedule = ${JSON.stringify(scheduleData)};`);

const htmlPath = join(tmpdir(), 'poster.html');
await writeFile(htmlPath, injected, 'utf8');

// 3) Chrome headless で撮影（16:9・等倍）
const rawPng = join(tmpdir(), 'poster_raw.png');
await exec(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1920,1080',
  `--screenshot=${rawPng}`,
  '--virtual-time-budget=3000',
  `file://${htmlPath}`,
]);

// 4) 念のため正確に1920×1080へ整形
const out = join(tmpdir(), 'weekly_schedule.png');
await sharp(rawPng).resize(1920, 1080, { fit: 'cover', position: 'top' }).png().toFile(out);
console.log(`画像を生成しました: ${out}（${week.range}）`);

// 5) Discordへ投稿（Webhookがあるときだけ）
if (WEBHOOK) {
  const buf = await readFile(out);
  const label = WEEK_OFFSET >= 1 ? '来週' : '今週';
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content: `🗓️ ${label}の配信予定（${week.range}）` }));
  form.append('files[0]', new Blob([buf], { type: 'image/png' }), 'weekly_schedule.png');
  const res = await fetch(WEBHOOK, { method: 'POST', body: form });
  if (!res.ok) {
    console.error('Discord投稿に失敗:', res.status, await res.text());
    process.exit(1);
  }
  console.log('✅ Discordへ投稿しました。');
} else {
  console.log('（Webhook未設定のため投稿はスキップ。画像のみ生成）');
}
