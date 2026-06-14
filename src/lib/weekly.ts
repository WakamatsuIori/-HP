/**
 * カレンダーの予定（StreamEvent[]）を「今週(月〜日)」の週間ボード用データに変換する純関数。
 * 日時はすべて日本時間(JST)で扱う。空き日は「本日休業」になる。
 */
import type { StreamEvent } from './ics';

const JST = 'Asia/Tokyo';
const keyFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: JST, dateStyle: 'short' }); // YYYY-MM-DD
const timeFmt = new Intl.DateTimeFormat('ja-JP', { timeZone: JST, hour: '2-digit', minute: '2-digit', hour12: false });
const JA = ['日', '月', '火', '水', '木', '金', '土'];

function jstKey(d: Date): string {
  return keyFmt.format(d);
}

export interface WeekDay {
  ja: string;
  date: string;
  time: string;
  title: string;
  featured?: boolean;
}
export interface WeekData {
  month: string;
  range: string;
  days: WeekDay[];
}

export function buildWeek(events: StreamEvent[], now: Date = new Date()): WeekData {
  // 今日のJSTカレンダー日付（日本にDSTは無いので UTC 正午で安全に表現できる）
  const [y, m, d] = jstKey(now).split('-').map(Number);
  const today = new Date(Date.UTC(y, m - 1, d, 12));
  const dow = today.getUTCDay(); // 0=日 .. 6=土
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + (dow === 0 ? -6 : 1 - dow));

  // JST日付キー → その日のイベント
  const byDay = new Map<string, StreamEvent[]>();
  for (const e of events) {
    const k = jstKey(e.start);
    const arr = byDay.get(k);
    if (arr) arr.push(e);
    else byDay.set(k, [e]);
  }

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setUTCDate(monday.getUTCDate() + i);
    const ev = (byDay.get(jstKey(dd)) ?? []).sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    days.push({
      ja: JA[dd.getUTCDay()],
      date: `${dd.getUTCMonth() + 1}/${dd.getUTCDate()}`,
      time: ev ? timeFmt.format(ev.start) : '',
      title: ev ? ev.title : '本日休業',
    });
  }

  const sun = new Date(monday);
  sun.setUTCDate(monday.getUTCDate() + 6);
  return {
    month: `${monday.toLocaleString('en-US', { month: 'long' }).toUpperCase()} ${monday.getUTCFullYear()}`,
    range: `${monday.getUTCMonth() + 1}/${monday.getUTCDate()} 〜 ${sun.getUTCMonth() + 1}/${sun.getUTCDate()}`,
    days,
  };
}
