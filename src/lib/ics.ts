/**
 * .icsテキストを「配信予定」の配列に変換する。
 * 繰り返し予定（毎週◯曜の定期配信など）は指定した期間内に展開する。
 * パースは node-ical に任せ、ここでは整形と展開だけを行う。
 */
import ical, { type CalendarComponent, type VEvent } from 'node-ical';

/** カレンダー由来の1予定。title/description は信頼しない外部入力として扱う（表示時にエスケープ） */
export interface StreamEvent {
  /** 予定の一意ID（UID + 開始時刻。繰り返し展開後も一意） */
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date | null;
}

function isVEvent(c: CalendarComponent): c is VEvent {
  return c.type === 'VEVENT';
}

function durationMs(ev: VEvent): number {
  return ev.end && ev.start ? ev.end.getTime() - ev.start.getTime() : 0;
}

function toStreamEvent(ev: VEvent, start: Date, end: Date | null): StreamEvent {
  return {
    id: `${ev.uid}@${start.toISOString()}`,
    title: typeof ev.summary === 'string' ? ev.summary : ((ev.summary as { val?: string })?.val ?? '(無題)'),
    description: typeof ev.description === 'string' ? ev.description : '',
    start,
    end,
  };
}

/** EXDATE（繰り返しの中の除外日）に該当するか */
function isExcluded(ev: VEvent, occurrence: Date): boolean {
  if (!ev.exdate) return false;
  return Object.values(ev.exdate).some(
    (d) => d instanceof Date && Math.abs(d.getTime() - occurrence.getTime()) < 1000,
  );
}

/**
 * この回だけ時間変更された予定（RECURRENCE-ID override）を探す。
 * node-icalのrecurrencesはキーの日付形式がタイムゾーン依存のため、
 * キーではなく recurrenceid（元の開始時刻）の一致で照合する
 * （UTC日付キーで引くと、JST深夜開始の予定で日付がずれて取りこぼす）。
 */
function findOverride(ev: VEvent, occurrence: Date): VEvent | undefined {
  if (!ev.recurrences) return undefined;
  return Object.values(ev.recurrences).find(
    (r) => r.recurrenceid instanceof Date && Math.abs(r.recurrenceid.getTime() - occurrence.getTime()) < 1000,
  );
}

/**
 * .icsテキストをパースし、[windowStart, windowEnd] に重なる予定を展開して返す。
 * 同じ入力に対して常に同じ結果を返す純関数（通信しない）。
 */
export function parseIcsEvents(icsText: string, windowStart: Date, windowEnd: Date): StreamEvent[] {
  const data = ical.sync.parseICS(icsText);
  const result: StreamEvent[] = [];

  for (const component of Object.values(data)) {
    if (!isVEvent(component)) continue;
    const ev = component;
    if (!ev.start) continue;

    if (ev.rrule) {
      // 繰り返し予定：期間内の発生日時に展開する
      const dur = durationMs(ev);
      const occurrences = ev.rrule.between(windowStart, windowEnd, true);
      for (const occ of occurrences) {
        if (isExcluded(ev, occ)) continue;
        // 個別に時間変更された回（recurrence override）があればそちらを優先
        const override = findOverride(ev, occ);
        if (override?.start) {
          result.push(toStreamEvent(override, override.start, override.end ?? null));
        } else {
          result.push(toStreamEvent(ev, occ, dur > 0 ? new Date(occ.getTime() + dur) : null));
        }
      }
    } else {
      // 単発予定：期間に重なるものだけ
      const start = ev.start;
      const end = ev.end ?? null;
      if (start.getTime() <= windowEnd.getTime() && (end ?? start).getTime() >= windowStart.getTime()) {
        result.push(toStreamEvent(ev, start, end));
      }
    }
  }

  result.sort((a, b) => a.start.getTime() - b.start.getTime());
  return result;
}
