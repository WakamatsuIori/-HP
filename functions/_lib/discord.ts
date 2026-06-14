/**
 * Discord Interactions（スラッシュコマンド）の署名検証とレスポンス組み立て。
 * Cloudflare Pages Functions（Workersランタイム）で動く＝Node APIは使わず fetch と WebCrypto のみ。
 */

/** 16進文字列 → Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const len = Math.floor(hex.length / 2);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

const encoder = new TextEncoder();

/**
 * Discordからのリクエストの署名(Ed25519)を検証する。
 * 検証対象は「タイムスタンプ + 生のリクエストボディ」。body は JSON.parse 前の文字列を渡すこと。
 */
export async function verifyDiscordSignature(
  publicKeyHex: string,
  signatureHex: string,
  timestamp: string,
  rawBody: string,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey('raw', hexToBytes(publicKeyHex), { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify(
      { name: 'Ed25519' },
      key,
      hexToBytes(signatureHex),
      encoder.encode(timestamp + rawBody),
    );
  } catch {
    return false;
  }
}

/** Discord interaction の種類 */
export const InteractionType = { PING: 1, APPLICATION_COMMAND: 2 } as const;

/** Discord へ返すレスポンスの種類 */
export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
} as const;

/** 本人だけに見えるメッセージのフラグ */
export const EPHEMERAL = 64;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
