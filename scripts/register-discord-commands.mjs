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
    description: '配信予定をカレンダーに登録します',
    type: 1, // CHAT_INPUT
    options: [
      { name: '日付', description: '例：6/20 または 2026/6/20', type: 3, required: true },
      { name: 'タイトル', description: '配信枠の名前（例：雑談配信）', type: 3, required: true },
      { name: '時間', description: '例：21:00（空のまま送ると休業として登録）', type: 3, required: false },
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
