import { describe, it, expect } from 'vitest';
import {
  currentJstYear,
  parseDate,
  parseTime,
  buildWhen,
  dayRange,
  buildWhenFromParts,
  encodePendingId,
  decodePendingId,
  REST_VALUE,
} from '../functions/_lib/datetime';

// 「いま」の既定値（JST 2026-06-14 21:00 = 12:00 UTC）。年の補完に使う。
const NOW = new Date('2026-06-14T12:00:00Z');

describe('currentJstYear', () => {
  it('JSTの年を返す', () => {
    expect(currentJstYear(NOW)).toBe(2026);
  });
  it('UTCでは前年でもJSTで年明けなら新しい年を返す', () => {
    // 2025-12-31 16:00 UTC = 2026-01-01 01:00 JST
    expect(currentJstYear(new Date('2025-12-31T16:00:00Z'))).toBe(2026);
  });
});

describe('parseDate', () => {
  it('M/D は既定年で補完する', () => {
    expect(parseDate('6/20', 2026)).toEqual({ y: 2026, m: 6, d: 20 });
  });
  it('YYYY/M/D は年を尊重する', () => {
    expect(parseDate('2027/1/3', 2026)).toEqual({ y: 2027, m: 1, d: 3 });
  });
  it('区切りは / - . を許容する', () => {
    expect(parseDate('6-20', 2026)).toEqual({ y: 2026, m: 6, d: 20 });
    expect(parseDate('6.20', 2026)).toEqual({ y: 2026, m: 6, d: 20 });
  });
  it('範囲外の月日や読めない文字列は null', () => {
    expect(parseDate('13/1', 2026)).toBeNull();
    expect(parseDate('6/32', 2026)).toBeNull();
    expect(parseDate('あした', 2026)).toBeNull();
  });
});

describe('parseTime', () => {
  it('HH:MM / HH / H:MM を読む', () => {
    expect(parseTime('21:00')).toEqual({ hh: 21, mm: 0 });
    expect(parseTime('21')).toEqual({ hh: 21, mm: 0 });
    expect(parseTime('9:30')).toEqual({ hh: 9, mm: 30 });
  });
  it('範囲外は null', () => {
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('12:60')).toBeNull();
    expect(parseTime('abc')).toBeNull();
  });
});

describe('buildWhen（時間あり）', () => {
  it('開始+60分の予定とラベルを作る（JST固定）', () => {
    const r = buildWhen('6/20', '21:00', NOW);
    expect(r).toEqual({
      startDateTime: '2026-06-20T21:00:00+09:00',
      endDateTime: '2026-06-20T22:00:00+09:00',
      label: '6/20(土) 21:00',
    });
  });
  it('深夜0:30でも開始/終了の日付がJSTで正しい', () => {
    const r = buildWhen('6/20', '0:30', NOW) as { startDateTime: string; endDateTime: string };
    expect(r.startDateTime).toBe('2026-06-20T00:30:00+09:00');
    expect(r.endDateTime).toBe('2026-06-20T01:30:00+09:00');
  });
});

describe('buildWhen（終日）', () => {
  it('時間なしは終日。end.date は翌日（排他）', () => {
    const r = buildWhen('6/20', undefined, NOW);
    expect(r).toEqual({ startDate: '2026-06-20', endDate: '2026-06-21', label: '6/20(土) 終日' });
  });
  it('月末は翌月1日へ繰り上がる', () => {
    const r = buildWhen('6/30', '', NOW) as { startDate: string; endDate: string };
    expect(r.startDate).toBe('2026-06-30');
    expect(r.endDate).toBe('2026-07-01');
  });
});

describe('buildWhen（エラー）', () => {
  it('日付が読めなければ error', () => {
    expect(buildWhen('xx', '21:00', NOW)).toHaveProperty('error');
  });
  it('時間が読めなければ error', () => {
    expect(buildWhen('6/20', '25:99', NOW)).toHaveProperty('error');
  });
});

describe('dayRange', () => {
  it('その日の0:00〜翌0:00（JST）を返す', () => {
    expect(dayRange('6/18', NOW)).toEqual({
      timeMin: '2026-06-18T00:00:00+09:00',
      timeMax: '2026-06-19T00:00:00+09:00',
      label: '6/18(木)',
    });
  });
  it('月末は翌月1日へ繰り上がる', () => {
    const r = dayRange('6/30', NOW) as { timeMin: string; timeMax: string };
    expect(r.timeMin).toBe('2026-06-30T00:00:00+09:00');
    expect(r.timeMax).toBe('2026-07-01T00:00:00+09:00');
  });
  it('読めない日付は error', () => {
    expect(dayRange('zz', NOW)).toHaveProperty('error');
  });
});

describe('buildWhen（存在しない日付）', () => {
  it('2/30 や 4/31 は error（手打ち経路も堅牢化）', () => {
    expect(buildWhen('2/30', '21:00', NOW)).toHaveProperty('error');
    expect(buildWhen('4/31', '', NOW)).toHaveProperty('error');
  });
});

describe('buildWhenFromParts（選択式・年自動）', () => {
  it('当日は過去にしない（同じ年のまま）', () => {
    const r = buildWhenFromParts(6, 14, '21:00', NOW);
    expect(r).toEqual({
      startDateTime: '2026-06-14T21:00:00+09:00',
      endDateTime: '2026-06-14T22:00:00+09:00',
      label: '6/14(日) 21:00',
    });
  });
  it('過ぎた月日は翌年へ（12月に「1/5」→翌年）', () => {
    const dec = new Date('2026-12-20T12:00:00Z'); // JST 2026-12-20 21:00
    const r = buildWhenFromParts(1, 5, '21:00', dec) as { startDateTime: string };
    expect(r.startDateTime).toBe('2027-01-05T21:00:00+09:00');
  });
  it('時間を省略すると 21:00 になる', () => {
    const r = buildWhenFromParts(7, 1, undefined, NOW) as { startDateTime: string };
    expect(r.startDateTime).toBe('2026-07-01T21:00:00+09:00');
  });
  it('お休み(REST_VALUE)は終日', () => {
    const r = buildWhenFromParts(7, 1, REST_VALUE, NOW);
    expect(r).toEqual({ startDate: '2026-07-01', endDate: '2026-07-02', label: '7/1(水) 終日' });
  });
  it('存在しない日付(2/30)は error', () => {
    expect(buildWhenFromParts(2, 30, '21:00', NOW)).toHaveProperty('error');
  });
  it('範囲外の月・日は error', () => {
    expect(buildWhenFromParts(13, 1, '21:00', NOW)).toHaveProperty('error');
    expect(buildWhenFromParts(6, 0, '21:00', NOW)).toHaveProperty('error');
  });
});

describe('encodePendingId / decodePendingId（確認データの往復）', () => {
  it('時間ありの予定を往復でき、custom_id は100字以内', () => {
    const when = buildWhenFromParts(6, 24, '21:00', NOW) as {
      startDateTime: string;
      endDateTime: string;
      label: string;
    };
    const id = encodePendingId(when, 'YouTube', true);
    expect(id.length).toBeLessThanOrEqual(100); // Discord custom_id 上限
    expect(decodePendingId(id)).toEqual({ when, platform: 'YouTube', featured: true });
  });
  it('終日（休業）も往復できる', () => {
    const when = buildWhenFromParts(7, 1, REST_VALUE, NOW) as {
      startDate: string;
      endDate: string;
      label: string;
    };
    expect(decodePendingId(encodePendingId(when, 'その他', false))).toEqual({
      when,
      platform: 'その他',
      featured: false,
    });
  });
  it('confirm用でない custom_id は null', () => {
    expect(decodePendingId('yt:x')).toBeNull();
    expect(decodePendingId('whatever')).toBeNull();
  });
});
