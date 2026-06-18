import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadScheduleWith, loadWeekEventsWith } from '../src/lib/loadSchedule';

const ics = readFileSync(join(__dirname, 'fixtures', 'sample.ics'), 'utf-8');
const now = new Date('2026-06-15T00:00:00Z'); // 6/15 09:00 JST

afterEach(() => {
  delete process.env.ICS_URL;
});

describe('loadScheduleWith（fetcher注入）', () => {
  it('注入fetcherでicsを取得し、今後の予定だけを時刻順で返す', async () => {
    process.env.ICS_URL = 'https://example.test/cal.ics';
    let calledUrl = '';
    const fetcher = async (url: string) => {
      calledUrl = url;
      return ics;
    };
    const events = await loadScheduleWith(fetcher, now);

    expect(calledUrl).toBe('https://example.test/cal.ics');
    expect(events.length).toBeGreaterThan(0);
    // 過去の予定（6/1の「終わった配信」）は含まれない
    expect(events.find((e) => e.title === '終わった配信')).toBeUndefined();
    // 時刻の昇順
    const times = events.map((e) => e.start.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('ICS_URL未設定なら例外を投げる（中途半端な公開を防ぐ＝ビルド失敗方針, §4）', async () => {
    await expect(loadScheduleWith(async () => ics, now)).rejects.toThrow(/ICS_URL/);
  });

  it('fetcherが失敗したら例外を伝播する（握りつぶさない）', async () => {
    process.env.ICS_URL = 'https://example.test/cal.ics';
    const boom = async () => {
      throw new Error('network down');
    };
    await expect(loadScheduleWith(boom, now)).rejects.toThrow(/network down/);
  });
});

describe('loadWeekEventsWith（週間ボード用・過去日も残す）', () => {
  // 6/17(水) 12:00 JST 時点では、6/16(火)の「ゲーム配信」はすでに過去。
  const wed = new Date('2026-06-17T03:00:00Z');

  it('今週の過ぎた日の予定もボード用には残す（upcomingで絞らない）', async () => {
    process.env.ICS_URL = 'https://example.test/cal.ics';
    const week = await loadWeekEventsWith(async () => ics, wed);
    expect(week.find((e) => e.title === 'ゲーム配信')).toBeDefined();
  });

  it('一覧/カウントダウン用の loadScheduleWith は同じ過去予定を落とす（役割分離の確認）', async () => {
    process.env.ICS_URL = 'https://example.test/cal.ics';
    const list = await loadScheduleWith(async () => ics, wed);
    expect(list.find((e) => e.title === 'ゲーム配信')).toBeUndefined();
  });
});
