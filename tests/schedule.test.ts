import { describe, it, expect } from 'vitest';
import type { StreamEvent } from '../src/lib/ics';
import { upcomingEvents, groupByJstDay, jstTime, jstDayLabel, relativeTimeJa } from '../src/lib/schedule';

function ev(id: string, startIso: string, endIso?: string): StreamEvent {
  return {
    id,
    title: id,
    description: '',
    start: new Date(startIso),
    end: endIso ? new Date(endIso) : null,
  };
}

const now = new Date('2026-06-15T00:00:00Z'); // 6/15 09:00 JST

describe('upcomingEvents', () => {
  it('過去の予定を除外し、開催中の予定は残す', () => {
    const events = [
      ev('past', '2026-06-14T10:00:00Z', '2026-06-14T11:00:00Z'),
      ev('ongoing', '2026-06-14T23:00:00Z', '2026-06-15T01:00:00Z'), // 開催中
      ev('future', '2026-06-16T12:00:00Z'),
    ];
    const result = upcomingEvents(events, now);
    expect(result.map((e) => e.id)).toEqual(['ongoing', 'future']);
  });

  it('指定日数より先の予定を除外する', () => {
    const events = [
      ev('in-window', '2026-06-28T12:00:00Z'),
      ev('too-far', '2026-07-01T12:00:00Z'),
    ];
    expect(upcomingEvents(events, now, 14).map((e) => e.id)).toEqual(['in-window']);
  });

  it('開始時刻の昇順に並べる', () => {
    const events = [ev('b', '2026-06-17T12:00:00Z'), ev('a', '2026-06-16T12:00:00Z')];
    expect(upcomingEvents(events, now).map((e) => e.id)).toEqual(['a', 'b']);
  });
});

describe('groupByJstDay', () => {
  it('日本時間の日付でグルーピングする（UTC日付ではない）', () => {
    // 6/16 23:30 JST と 6/17 00:30 JST（UTCではどちらも6/16）
    const events = [ev('night', '2026-06-16T14:30:00Z'), ev('midnight', '2026-06-16T15:30:00Z')];
    const groups = groupByJstDay(events);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.dateKey).toBe('2026-06-16');
    expect(groups[1]!.dateKey).toBe('2026-06-17');
  });

  it('同じ日の予定を1グループにまとめる', () => {
    const events = [ev('a', '2026-06-16T10:00:00Z'), ev('b', '2026-06-16T12:00:00Z')];
    const groups = groupByJstDay(events);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.events).toHaveLength(2);
  });
});

describe('表示フォーマット', () => {
  it('jstTime: 日本時間のHH:MMを返す', () => {
    expect(jstTime(new Date('2026-06-16T12:00:00Z'))).toBe('21:00');
  });

  it('jstDayLabel: 「6/16（火）」形式を返す', () => {
    expect(jstDayLabel(new Date('2026-06-16T12:00:00Z'))).toBe('6/16（火）');
  });

  it('relativeTimeJa: 分・時間・日の相対表記', () => {
    const base = new Date('2026-06-15T00:00:00Z');
    expect(relativeTimeJa(base, new Date('2026-06-15T00:00:30Z'))).toBe('たった今');
    expect(relativeTimeJa(base, new Date('2026-06-15T00:10:00Z'))).toBe('10分前');
    expect(relativeTimeJa(base, new Date('2026-06-15T03:00:00Z'))).toBe('3時間前');
    expect(relativeTimeJa(base, new Date('2026-06-17T00:00:00Z'))).toBe('2日前');
  });
});
