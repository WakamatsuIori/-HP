// `/予定` スラッシュコマンドをDiscordに登録する（初回＆コマンド内容を変えたときに一度だけ実行）。
//
// 使い方（PowerShell例）:
//   $env:DISCORD_APP_ID="..."; $env:DISCORD_BOT_TOKEN="..."; $env:DISCORD_GUILD_ID="..."; node scripts/register-discord-commands.mjs
//
//   DISCORD_APP_ID    … Discord Developer Portal の「Application ID」
//   DISCORD_BOT_TOKEN … 同 Bot の Token
//   DISCORD_GUILD_ID  … （任意）自分のサーバーID。指定するとそのサーバーへ即時反映。
//                        省略するとグローバル登録（全体に反映まで最大1時間ほどかかる）。
//
// ※ ここで使う値は実行時の環境変数だけ。コードやリポジトリには絶対に書かないこと（CLAUDE.md §3）。
import process from 'node:process';

const APP_ID = process.env.DISCORD_APP_ID;
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD = process.env.DISCORD_GUILD_ID; // 任意

if (!APP_ID || !TOKEN) {
  console.error('DISCORD_APP_ID と DISCORD_BOT_TOKEN を環境変数で渡してください。');
  process.exit(1);
}

// Discordのオプションは「必須」を先に並べる必要がある。
const commands = [
  {
    name: '予定',
    description: '配信予定をカレンダーに登録します（選ぶ→確認→確定）',
    type: 1, // CHAT_INPUT
    // Discordは「必須」オプションを先に並べる必要がある。日付は手打ちをやめ、月/日を数値で選ぶ（入力ミス防止）。
    options: [
      { name: '月', description: '配信する月（1〜12）', type: 4, required: true, min_value: 1, max_value: 12 }, // INTEGER
      { name: '日', description: '配信する日（1〜31）', type: 4, required: true, min_value: 1, max_value: 31 }, // INTEGER
      { name: 'タイトル', description: '配信枠の名前（例：雑談配信）', type: 3, required: true, max_length: 100 }, // embed.title 256字上限より十分短く

      {
        name: '時間',
        description: '開始時刻（省略すると21:00）。お休みの日は「休業」を選ぶ',
        type: 3, // STRING
        required: false,
        choices: [
          { name: '19:00', value: '19:00' },
          { name: '20:00', value: '20:00' },
          { name: '21:00', value: '21:00' },
          { name: '21:30', value: '21:30' },
          { name: '22:00', value: '22:00' },
          { name: '休業（お休み）', value: '休業' }, // ← functions/_lib/datetime.ts の REST_VALUE と一致させること
        ],
      },
      {
        name: 'プラットフォーム',
        description: '配信する場所（省略するとYouTube）',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'YouTube', value: 'YouTube' },
          { name: 'Twitch', value: 'Twitch' },
          { name: 'その他', value: 'その他' },
        ],
      },
      { name: 'おすすめ', description: '週間ボードで金色強調＋◆を付ける', type: 5, required: false }, // BOOLEAN
    ],
  },
  {
    name: '予定表',
    description: '週間予定ポスター（画像）を生成してこのサーバーに投稿します',
    type: 1, // CHAT_INPUT
    options: [
      {
        name: '週',
        description: 'どの週のポスターを作るか（省略時は今週）',
        type: 3, // STRING
        required: false,
        choices: [
          { name: '今週', value: '今週' },
          { name: '来週', value: '来週' },
        ],
      },
    ],
  },
  {
    name: '予定消去',
    description: '指定した日付の予定をすべて消します',
    type: 1, // CHAT_INPUT
    options: [
      { name: '日付', description: '消したい日（例：6/18 または 2026/6/18）', type: 3, required: true },
    ],
  },
  {
    name: '更新',
    description: 'サイトを今すぐ再ビルドして最新の予定・動画を反映します',
    type: 1, // CHAT_INPUT
  },
];

const url = GUILD
  ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD}/commands`
  : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

const res = await fetch(url, {
  method: 'PUT',
  headers: { authorization: `Bot ${TOKEN}`, 'content-type': 'application/json' },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error('登録に失敗:', res.status, await res.text());
  process.exit(1);
}

console.log(`✅ コマンドを登録しました（${GUILD ? 'guild: ' + GUILD : 'global'}）`);
