/**
 * Discordで打たれた「日付」「時間」を、Googleカレンダー用の日時に変換する。
 * すべて日本時間(JST, +09:00)固定。時間が空なら終日（休業）扱い。
 */
export interface ParsedWhen {
  // 時間あり
  startDateTime?: string;
  endDateTime?: string;
  // 終日（休業など）
  startDate?: string;
  endDate?: string;
  /** 表示用ラベル（例 "6/20(土) 21:00" / "6/20(土) 終日"） */
  label: string;
}

const JA_DOW = ['日', '月', '火', '水', '木', '金', '土'];
const pad = (n: number) => String(n).padStart(2, '0');

/** 配信枠の標準の長さ（分） */
const DEFAULT_DURATION_MIN = 60;

/** いまのJSTの年（年を省略されたときの既定値） */
export function currentJstYear(now: Date): number {
  return Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric' }).format(now));
}

/** "6/20" "2026/6/20" "6-20" などを {y,m,d} に。読めなければ null */
export function parseDate(input: string, defaultYear: number): { y: number; m: number; d: number } | null {
  const m = input.trim().match(/^(?:(\d{4})[/\-.])?(\d{1,2})[/\-.](\d{1,2})$/);
  if (!m) return null;
  const y = m[1] ? Number(m[1]) : defaultYear;
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/** "21:00" "21" "9:30" を {hh,mm} に。読めなければ null */
export function parseTime(input: string): { hh: number; mm: number } | null {
  const m = input.trim().match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = m[2] ? Number(m[2]) : 0;
  if (hh > 23 || mm > 59) return null;
  return { hh, mm };
}

/** JSTのy/m/dの曜日（UTC正午で安全に求める） */
function dowOf(y: number, m: number, d: number): string {
  return JA_DOW[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()];
}

/** UTCミリ秒の瞬間を +09:00 のRFC3339文字列にする */
function jstRfc3339(utcMs: number): string {
  const j = new Date(utcMs + 9 * 3600_000); // UTCフィールドがJSTの壁時計時刻になるようずらす
  return `${j.getUTCFullYear()}-${pad(j.getUTCMonth() + 1)}-${pad(j.getUTCDate())}T${pad(j.getUTCHours())}:${pad(
    j.getUTCMinutes(),
  )}:00+09:00`;
}

/** 配信プラットフォームの既定値 */
export const DEFAULT_PLATFORM = 'YouTube';
/** 時間を省略したときの既定の開始時刻 */
export const DEFAULT_TIME = '21:00';
/** 「時間」選択肢で“お休み（終日）”を表す値。register-discord-commands.mjs の choice value と一致させること。 */
export const REST_VALUE = '休業';

/** y/m/d（＋任意の時刻文字列）から ParsedWhen を作る共通処理。存在しない日付(2/30等)は error。 */
function composeWhen(y: number, m: number, d: number, timeStr: string | undefined): ParsedWhen | { error: string } {
  // 存在チェック：Date.UTC は 2/30 を 3/2 に繰り上げる。元の y/m/d に戻らなければ存在しない日付。
  const probe = new Date(Date.UTC(y, m - 1, d, 12));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return { error: 'その日付は存在しないみたい。月と日をもう一度確かめてね' };
  }
  const dow = dowOf(y, m, d);

  if (timeStr && timeStr.trim()) {
    const t = parseTime(timeStr);
    if (!t) return { error: `時間の形式が読めませんでした：「${timeStr}」。例：21:00` };
    const startDateTime = `${y}-${pad(m)}-${pad(d)}T${pad(t.hh)}:${pad(t.mm)}:00+09:00`;
    const startUtcMs = Date.UTC(y, m - 1, d, t.hh - 9, t.mm); // JST→UTC
    const endDateTime = jstRfc3339(startUtcMs + DEFAULT_DURATION_MIN * 60_000);
    return { startDateTime, endDateTime, label: `${m}/${d}(${dow}) ${pad(t.hh)}:${pad(t.mm)}` };
  }

  // 終日（休業）。Googleの終日はend.dateが排他なので翌日を入れる。
  const startDate = `${y}-${pad(m)}-${pad(d)}`;
  const next = new Date(Date.UTC(y, m - 1, d + 1, 12));
  const endDate = `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
  return { startDate, endDate, label: `${m}/${d}(${dow}) 終日` };
}

/**
 * 日付（必須）・時間（任意）から ParsedWhen を作る。手打ちの「6/20」等を解釈する経路。
 * 時間ありなら開始〜+60分の予定、時間なしなら終日（休業）。
 */
export function buildWhen(dateStr: string, timeStr: string | undefined, now: Date): ParsedWhen | { error: string } {
  const ymd = parseDate(dateStr, currentJstYear(now));
  if (!ymd) return { error: `日付の形式が読めませんでした：「${dateStr}」。例：6/20 または 2026/6/20` };
  return composeWhen(ymd.y, ymd.m, ymd.d, timeStr);
}

const jstYmdFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** いまのJSTの {y,m,d} */
function jstToday(now: Date): { y: number; m: number; d: number } {
  const [y, m, d] = jstYmdFmt.format(now).split('-').map(Number);
  return { y, m, d };
}

/**
 * 月・日（数値）と時間選択から ParsedWhen を作る（選択式 /予定 用）。
 * 年は自動：選んだ月日が今日(JST)より前なら翌年（当日はOK＝過去にしない）。
 * timeChoice が REST_VALUE（お休み）なら終日、省略なら DEFAULT_TIME、それ以外は時刻として解釈。
 */
export function buildWhenFromParts(
  month: number,
  day: number,
  timeChoice: string | undefined,
  now: Date,
): ParsedWhen | { error: string } {
  if (!Number.isInteger(month) || month < 1 || month > 12) return { error: '「月」は1〜12で選んでね' };
  if (!Number.isInteger(day) || day < 1 || day > 31) return { error: '「日」は1〜31で選んでね' };

  const today = jstToday(now);
  let year = today.y;
  // 月日が今日より前なら翌年送り（12月に「1/5」と打つ等の“去年事故”を防止）。当日は過去にしない。
  if (month < today.m || (month === today.m && day < today.d)) year += 1;

  const timeStr = timeChoice === REST_VALUE ? undefined : (timeChoice ?? DEFAULT_TIME);
  return composeWhen(year, month, day, timeStr);
}

/** 確認ボタンの custom_id 接頭辞（confirm）。decode 側と一致させる。 */
const CONFIRM_PREFIX = 'yt:c';

/**
 * 確認カードの「確定」ボタンに載せる保留データ（日時・プラットフォーム・おすすめ）を custom_id 文字列にする。
 * タイトルは custom_id の100字制限を避けるため embed.title 側で運ぶ（ここには含めない）。
 * 区切りは '|'（日時・ラベル・プラットフォームに現れない文字）。
 */
export function encodePendingId(when: ParsedWhen, platform: string, featured: boolean): string {
  const timed = Boolean(when.startDateTime);
  const a = timed ? when.startDateTime! : (when.startDate ?? '');
  const b = timed ? (when.endDateTime ?? when.startDateTime!) : (when.endDate ?? '');
  return [CONFIRM_PREFIX, timed ? 'T' : 'A', a, b, platform, featured ? '1' : '0', when.label].join('|');
}

/** encodePendingId の逆。confirm用 custom_id でなければ null。 */
export function decodePendingId(
  customId: string,
): { when: ParsedWhen; platform: string; featured: boolean } | null {
  if (typeof customId !== 'string') return null;
  const parts = customId.split('|');
  if (parts.length < 7 || parts[0] !== CONFIRM_PREFIX) return null;
  const kind = parts[1];
  const a = parts[2];
  const b = parts[3];
  const platform = parts[4] || DEFAULT_PLATFORM;
  const featured = parts[5] === '1';
  const label = parts.slice(6).join('|'); // 念のため（label に '|' は無い想定）
  if (!a || !label) return null;
  const when: ParsedWhen =
    kind === 'T' ? { startDateTime: a, endDateTime: b || a, label } : { startDate: a, endDate: b, label };
  return { when, platform, featured };
}

/** 日付文字列(JST)を、その日の0:00〜翌0:00（RFC3339 +09:00）に変換する。削除の検索範囲用 */
export function dayRange(
  dateStr: string,
  now: Date,
): { timeMin: string; timeMax: string; label: string } | { error: string } {
  const ymd = parseDate(dateStr, currentJstYear(now));
  if (!ymd) return { error: `日付の形式が読めませんでした：「${dateStr}」。例：6/18 または 2026/6/18` };
  const { y, m, d } = ymd;
  const next = new Date(Date.UTC(y, m - 1, d + 1, 12));
  return {
    timeMin: `${y}-${pad(m)}-${pad(d)}T00:00:00+09:00`,
    timeMax: `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}T00:00:00+09:00`,
    label: `${m}/${d}(${dowOf(y, m, d)})`,
  };
}
