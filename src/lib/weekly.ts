/**
 * カレンダーの予定（StreamEvent[]）を「今週(月〜日)」の週間ボード用データに変換する純関数。
 * 日時はすべて日本時間(JST)で扱う。空き日は「休業」になる。
 */
// 相対importは拡張子(.ts)付き：Node 24 がこの .ts を直接実行（型ストリッピング）する際、
// 拡張子なしの相対指定は解決できないため（ポスター生成 scripts/make-poster.mjs 経由で読まれる）。
import type { StreamEvent } from './ics.ts';
import { jstDateKey, jstTime } from './schedule.ts';
import { FEATURED_MARK } from './featured.ts';

const JA = ['日', '月', '火', '水', '木', '金', '土'];

// 「おすすめ枠」の目印は src/lib/featured.ts に一元化。互換のため従来どおりここでも再エクスポートする。
export { FEATURED_MARK };

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

export function buildWeek(events: StreamEvent[], now: Date = new Date(), weekOffset = 0): WeekData {
  // 今日のJSTカレンダー日付（日本にDSTは無いので UTC 正午で安全に表現できる）
  const [y, m, d] = jstDateKey(now).split('-').map(Number);
  const today = new Date(Date.UTC(y, m - 1, d, 12));
  const dow = today.getUTCDay(); // 0=日 .. 6=土
  const monday = new Date(today);
  // 今週(weekOffset=0)/来週(1)… の月曜に合わせる
  monday.setUTCDate(today.getUTCDate() + (dow === 0 ? -6 : 1 - dow) + 7 * weekOffset);

  // JST日付キー → その日のイベント
  const byDay = new Map<string, StreamEvent[]>();
  for (const e of events) {
    const k = jstDateKey(e.start);
    const arr = byDay.get(k);
    if (arr) arr.push(e);
    else byDay.set(k, [e]);
  }

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setUTCDate(monday.getUTCDate() + i);
    const ev = (byDay.get(jstDateKey(dd)) ?? []).sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    const off = !ev || ev.allDay === true; // 予定なし or 終日（休業）登録は休業扱い
    days.push({
      ja: JA[dd.getUTCDay()],
      date: `${dd.getUTCMonth() + 1}/${dd.getUTCDate()}`,
      time: off ? '' : jstTime(ev.start),
      title: ev ? ev.title : '休業',
      featured: !off && (ev.description ?? '').includes(FEATURED_MARK),
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
