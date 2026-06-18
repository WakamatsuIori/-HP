import { describe, it, expect } from 'vitest';
import { buildWeek, FEATURED_MARK } from '../src/lib/weekly';
import type { StreamEvent } from '../src/lib/ics';

// テスト用に最小の StreamEvent を作るヘルパ。start は UTC で渡す（JST=UTC+9）。
function ev(startUtcIso: string, title: string, opts: Partial<StreamEvent> = {}): StreamEvent {
  const start = new Date(startUtcIso);
  return {
    id: `${title}@${startUtcIso}`,
    title,
    description: opts.description ?? '',
    start,
    end: opts.end ?? null,
    ...(opts.allDay !== undefined ? { allDay: opts.allDay } : {}),
  };
}

// 基準時刻: 2026-06-17(水) 12:00 JST = 03:00 UTC。今週は 月6/15 〜 日6/21。
const NOW_WED = new Date('2026-06-17T03:00:00Z');

describe('buildWeek', () => {
  it('月曜始まり日曜終わりの7日・曜日・日付・月/range を正しく組む', () => {
    const wk = buildWeek([], NOW_WED);
    expect(wk.days).toHaveLength(7);
    expect(wk.days.map((d) => d.ja)).toEqual(['月', '火', '水', '木', '金', '土', '日']);
    expect(wk.days.map((d) => d.date)).toEqual(['6/15', '6/16', '6/17', '6/18', '6/19', '6/20', '6/21']);
    expect(wk.month).toBe('JUNE 2026');
    expect(wk.range).toBe('6/15 〜 6/21');
  });

  it('予定が無い日は「休業」・時刻空・featuredなし', () => {
    const wk = buildWeek([], NOW_WED);
    for (const d of wk.days) {
      expect(d.title).toBe('休業');
      expect(d.time).toBe('');
      expect(d.featured).toBe(false);
    }
  });

  it('時間指定の予定はタイトルとJST時刻を表示する（21:00 JST = 12:00 UTC）', () => {
    const wk = buildWeek([ev('2026-06-16T12:00:00Z', 'ゲーム配信')], NOW_WED);
    const tue = wk.days[1]; // 6/16(火)
    expect(tue.title).toBe('ゲーム配信');
    expect(tue.time).toBe('21:00');
  });

  it('weekOffset=1 で翌週(月6/22〜日6/28)に切り替わる', () => {
    const wk = buildWeek([], NOW_WED, 1);
    expect(wk.range).toBe('6/22 〜 6/28');
    expect(wk.days.map((d) => d.date)).toEqual(['6/22', '6/23', '6/24', '6/25', '6/26', '6/27', '6/28']);
  });

  it('終日予定は休業扱い（時刻空・featuredなし）だがタイトルはその予定名を出す', () => {
    const wk = buildWeek([ev('2026-06-18T00:00:00Z', '休業日', { allDay: true })], NOW_WED);
    const thu = wk.days[3]; // 6/18(木)
    expect(thu.title).toBe('休業日');
    expect(thu.time).toBe('');
    expect(thu.featured).toBe(false);
  });

  it('説明欄に #おすすめ を含む時間指定予定は featured=true', () => {
    const wk = buildWeek(
      [ev('2026-06-19T12:00:00Z', '記念配信', { description: `特別企画 ${FEATURED_MARK}` })],
      NOW_WED,
    );
    expect(wk.days[4].featured).toBe(true); // 6/19(金)
  });

  it('#おすすめ でも終日予定なら featured にしない', () => {
    const wk = buildWeek(
      [ev('2026-06-19T00:00:00Z', '休み', { allDay: true, description: FEATURED_MARK })],
      NOW_WED,
    );
    expect(wk.days[4].featured).toBe(false);
  });

  it('同じ日に複数予定があるときは開始が最も早いものを採用する', () => {
    const wk = buildWeek(
      [
        ev('2026-06-17T12:00:00Z', '夜配信'), // 21:00 JST
        ev('2026-06-17T05:00:00Z', '朝配信'), // 14:00 JST
      ],
      NOW_WED,
    );
    const wed = wk.days[2]; // 6/17(水)
    expect(wed.title).toBe('朝配信');
    expect(wed.time).toBe('14:00');
  });

  it('日曜を基準時刻にしても、その日曜で終わる週(月〜日)になる', () => {
    const nowSun = new Date('2026-06-21T03:00:00Z'); // 6/21(日) 12:00 JST
    const wk = buildWeek([], nowSun);
    expect(wk.range).toBe('6/15 〜 6/21');
    expect(wk.days[6].date).toBe('6/21');
  });
});
