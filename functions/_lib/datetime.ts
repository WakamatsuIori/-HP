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

/**
 * 日付（必須）・時間（任意）から ParsedWhen を作る。
 * 時間ありなら開始〜+60分の予定、時間なしなら終日（休業）。
 */
export function buildWhen(dateStr: string, timeStr: string | undefined, now: Date): ParsedWhen | { error: string } {
  const ymd = parseDate(dateStr, currentJstYear(now));
  if (!ymd) return { error: `日付の形式が読めませんでした：「${dateStr}」。例：6/20 または 2026/6/20` };
  const { y, m, d } = ymd;
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
