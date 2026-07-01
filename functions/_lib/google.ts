/**
 * Googleカレンダーへ「予定を1件追加する」だけの最小クライアント。
 * サービスアカウントのJWT(RS256)を自分で署名してアクセストークンを取得する（追加依存なし・WebCryptoのみ）。
 * 書き込みは events.insert のみ。更新・削除・双方向同期はしない（一方向・追記。CLAUDE.md §4/§9）。
 */

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof data === 'string') bytes = new TextEncoder().encode(data);
  else if (data instanceof Uint8Array) bytes = data;
  else bytes = new Uint8Array(data);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** PEM(PKCS8) → DER(ArrayBuffer) */
function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(body);
  const der = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);
  return der.buffer;
}

export interface ServiceAccount {
  clientEmail: string;
  /** PEM形式の秘密鍵（-----BEGIN PRIVATE KEY----- ...） */
  privateKey: string;
}

/** JWTを作成し、トークンエンドポイントでアクセストークンに交換する */
export async function getAccessToken(
  sa: ServiceAccount,
  nowSec: number,
  scope = 'https://www.googleapis.com/auth/calendar.events',
): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.clientEmail,
      scope,
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600,
    }),
  );
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${b64url(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`アクセストークン取得に失敗: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('アクセストークンが空でした');
  return data.access_token;
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  /** 時間指定あり（RFC3339 +09:00） */
  startDateTime?: string;
  endDateTime?: string;
  /** 終日（YYYY-MM-DD。endDateは排他＝翌日） */
  startDate?: string;
  endDate?: string;
}

export async function insertEvent(
  token: string,
  calendarId: string,
  ev: CalendarEventInput,
): Promise<{ id: string; htmlLink?: string }> {
  const body: Record<string, unknown> = { summary: ev.summary };
  if (ev.description) body.description = ev.description;
  if (ev.startDateTime) {
    body.start = { dateTime: ev.startDateTime, timeZone: 'Asia/Tokyo' };
    body.end = { dateTime: ev.endDateTime ?? ev.startDateTime, timeZone: 'Asia/Tokyo' };
  } else {
    body.start = { date: ev.startDate };
    body.end = { date: ev.endDate };
  }
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`予定の追加に失敗: ${res.status} ${await res.text()}`);
  return (await res.json()) as { id: string; htmlLink?: string };
}

export interface CalendarItem {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  recurringEventId?: string;
}

/** 指定期間に開始する予定を取得する（繰り返しは展開）。削除対象を探すのに使う */
export async function listEvents(
  token: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarItem[]> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  const res = await fetch(url.toString(), { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`予定の取得に失敗: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { items?: CalendarItem[] };
  return data.items ?? [];
}

/** 予定を1件削除する */
export async function deleteEvent(token: string, calendarId: string, eventId: string): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const res = await fetch(url, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
  // 200/204 は成功。既に消えている(410/404)は成功扱い。
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    throw new Error(`予定の削除に失敗: ${res.status} ${await res.text()}`);
  }
}

/**
 * Google スプレッドシートの指定シートに1行追記する（values.append）。
 * サービスアカウント(clientEmail)にそのシートの編集権限が必要（＝シートを共有しておく）。
 * getAccessToken には scope に 'https://www.googleapis.com/auth/spreadsheets' を渡すこと。
 */
export async function appendSheetRow(
  token: string,
  spreadsheetId: string,
  range: string,
  row: (string | number)[],
): Promise<void> {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) throw new Error(`シート追記に失敗: ${res.status} ${await res.text()}`);
}
