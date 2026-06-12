import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseIcsEvents } from '../src/lib/ics';

const icsText = readFileSync(join(__dirname, 'fixtures', 'sample.ics'), 'utf-8');

// テスト用の固定期間: 2026-06-14 〜 2026-06-29（UTC基準）
const windowStart = new Date('2026-06-14T00:00:00Z');
const windowEnd = new Date('2026-06-29T00:00:00Z');

describe('parseIcsEvents', () => {
  const events = parseIcsEvents(icsText, windowStart, windowEnd);

  it('JST指定の単発予定を正しいUTC時刻で読み取る（21:00 JST = 12:00 UTC）', () => {
    const ev = events.find((e) => e.title === 'ゲーム配信');
    expect(ev).toBeDefined();
    expect(ev!.start.toISOString()).toBe('2026-06-16T12:00:00.000Z');
    expect(ev!.end?.toISOString()).toBe('2026-06-16T13:30:00.000Z');
    expect(ev!.description).toContain('のんびり');
  });

  it('UTC指定の単発予定を読み取る', () => {
    const ev = events.find((e) => e.title === '歌枠');
    expect(ev).toBeDefined();
    expect(ev!.start.toISOString()).toBe('2026-06-17T12:00:00.000Z');
  });

  it('期間外の過去予定は含めない', () => {
    expect(events.find((e) => e.title === '終わった配信')).toBeUndefined();
  });

  it('毎週の繰り返し予定を期間内に展開する（除外日はスキップ）', () => {
    const weekly = events.filter((e) => e.title === '週末雑談');
    const dates = weekly.map((e) => e.start.toISOString().slice(0, 10));
    // 期間内の金曜は 6/19 と 6/26。6/19 は EXDATE で除外されている
    expect(dates).not.toContain('2026-06-19');
    expect(dates).toContain('2026-06-26');
  });

  it('繰り返し予定の各回が元の予定と同じ時刻・長さを持つ', () => {
    const occ = events.find((e) => e.title === '週末雑談' && e.start.toISOString().startsWith('2026-06-26'));
    expect(occ).toBeDefined();
    // 20:00 JST = 11:00 UTC、90分枠
    expect(occ!.start.toISOString()).toBe('2026-06-26T11:00:00.000Z');
    expect(occ!.end!.getTime() - occ!.start.getTime()).toBe(90 * 60 * 1000);
  });

  it('開始時刻の昇順に並んでいる', () => {
    const times = events.map((e) => e.start.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('展開後の予定IDが一意である（冪等性の前提）', () => {
    const ids = events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
