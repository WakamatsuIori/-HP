/**
 * スケジュール表示用の整形ロジック（純関数のみ。通信・副作用なし）。
 * 日時はすべて日本時間（Asia/Tokyo）で表示する。
 */
import type { StreamEvent } from './ics';

export interface DayGroup {
  /** 例: "6/15（月）" */
  label: string;
  /** 例: "2026-06-15"（JSTの日付キー） */
  dateKey: string;
  events: StreamEvent[];
}

const JST = 'Asia/Tokyo';

const dateKeyFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: JST, dateStyle: 'short' }); // YYYY-MM-DD
const labelFmt = new Intl.DateTimeFormat('ja-JP', { timeZone: JST, month: 'numeric', day: 'numeric', weekday: 'short' });
const timeFmt = new Intl.DateTimeFormat('ja-JP', { timeZone: JST, hour: '2-digit', minute: '2-digit', hour12: false });

/** JSTの日付キー（YYYY-MM-DD） */
export function jstDateKey(d: Date): string {
  return dateKeyFmt.format(d);
}

/** JSTの "6/15(月)" 形式 → "6/15（月）" に整える */
export function jstDayLabel(d: Date): string {
  return labelFmt.format(d).replace('(', '（').replace(')', '）');
}

/** JSTの "21:00" 形式 */
export function jstTime(d: Date): string {
  return timeFmt.format(d);
}

/** now以降（開催中含む）かつ days日先までの予定を時刻順で返す */
export function upcomingEvents(events: StreamEvent[], now: Date, days = 14): StreamEvent[] {
  const limit = now.getTime() + days * 24 * 60 * 60 * 1000;
  return events
    .filter((e) => (e.end ?? e.start).getTime() >= now.getTime() && e.start.getTime() <= limit)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** JSTの日付ごとにグルーピング（入力順を保つため、事前にソート済みであること） */
export function groupByJstDay(events: StreamEvent[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const ev of events) {
    const key = jstDateKey(ev.start);
    const last = groups[groups.length - 1];
    if (last && last.dateKey === key) {
      last.events.push(ev);
    } else {
      groups.push({ dateKey: key, label: jstDayLabel(ev.start), events: [ev] });
    }
  }
  return groups;
}

/** 「◯分前」「◯時間前」などの相対表記（最終更新表示用） */
export function relativeTimeJa(from: Date, to: Date): string {
  const diffMin = Math.max(0, Math.floor((to.getTime() - from.getTime()) / 60_000));
  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  return `${Math.floor(diffHour / 24)}日前`;
}
